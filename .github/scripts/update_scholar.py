"""Refresh the Research impact numbers in index.html from Google Scholar (via SerpAPI).

Reads SERPAPI_KEY from the environment. Exits non-zero, leaving files untouched,
if the API call fails or the response lacks the expected table.
Prints "changed" when index.html was updated, "unchanged" otherwise.
"""
import datetime
import json
import os
import re
import sys
import urllib.parse
import urllib.request

AUTHOR_ID = 'rmsd73IAAAAJ'
PAGE = os.path.join(os.path.dirname(__file__), '..', '..', 'index.html')


def fetch(key):
    q = urllib.parse.urlencode({'engine': 'google_scholar_author', 'author_id': AUTHOR_ID, 'hl': 'en', 'api_key': key})
    with urllib.request.urlopen('https://serpapi.com/search.json?' + q, timeout=60) as r:
        return json.load(r)


def parse(data):
    """Return {'citations': (all, since, since_year), 'h_index': ..., 'i10_index': ...}."""
    if data.get('error'):
        raise SystemExit('SerpAPI error: ' + str(data['error']))
    table = data.get('cited_by', {}).get('table') or []
    out = {}
    for row in table:
        for name, vals in row.items():
            since_key = next((k for k in vals if k.startswith('since_')), None)
            if name in ('citations', 'h_index', 'i10_index') and 'all' in vals and since_key:
                out[name] = (int(vals['all']), int(vals[since_key]), since_key.split('_', 1)[1])
    missing = {'citations', 'h_index', 'i10_index'} - out.keys()
    if missing:
        raise SystemExit('Unexpected response, missing: ' + ', '.join(sorted(missing)))
    return out


def apply(html, stats, today):
    def put(h, key, value):
        new, n = re.subn(r'(<span[^>]*data-scholar="%s"[^>]*>)[^<]*(</span>)' % key, r'\g<1>%s\g<2>' % value, h)
        if n != 1:
            raise SystemExit('Marker data-scholar="%s" not found exactly once' % key)
        return new

    new = html
    for name, (total, since, year) in stats.items():
        new = put(new, name, total)
        new = put(new, name + '_since', '%d since %s' % (since, year))
    if new != html:
        new = put(new, 'updated', 'Updated ' + today.strftime('%-d %b %Y'))
    return new


def main():
    key = os.environ.get('SERPAPI_KEY')
    if not key:
        raise SystemExit('SERPAPI_KEY is not set')
    stats = parse(fetch(key))
    with open(PAGE, encoding='utf-8') as f:
        html = f.read()
    new = apply(html, stats, datetime.date.today())
    if new == html:
        print('unchanged', stats)
        return
    with open(PAGE, 'w', encoding='utf-8') as f:
        f.write(new)
    print('changed', stats)


if __name__ == '__main__':
    sys.exit(main())
