import sys
data = open('hero-bg-3d.js', 'rb').read()
print(f'File size: {len(data)}')

# The issue: ].join(' followed by CRLF followed by ');
# This splits the string literal '\n' across two lines
# We need: ].join('\n'); (with literal backslash-n, not real newline)

broken = b"].join('\r\n');"
fixed = b"].join('\\n');"
count = data.count(broken)
print(f'Found {count} occurrences of broken ].join CRLF pattern')

if count > 0:
    newdata = data.replace(broken, fixed)
    open('hero-bg-3d.js', 'wb').write(newdata)
    print('Fixed \\n separator split')
else:
    print('No CRLF pattern found, checking actual bytes...')
    # Find ].join
    idx = data.find(b"].join")
    if idx >= 0:
        print(f'First ].join at byte {idx}')
        print(f'Around it: {data[idx:idx+25]!r}')
        print(f'Hex: {data[idx:idx+25].hex()}')
    sys.exit(1)
