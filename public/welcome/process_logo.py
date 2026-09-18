import zlib, struct

# Load original PNG
with open(r'C:\Users\ESMIS 2601\.gemini\antigravity\scratch\proptii-welcome-landing\assets\proptii-logo-original.png', 'rb') as f:
    data = f.read()

pos = 8
idat = b''
while pos < len(data):
    length, chunk_type = struct.unpack('>I4s', data[pos:pos+8])
    pos += 8
    if chunk_type == b'IDAT':
        idat += data[pos:pos+length]
    pos += length + 4

raw = zlib.decompress(idat)
w, h = 130, 52
bpp = 4
stride = w * bpp + 1

def unfilter(raw, w, h, bpp):
    lines = []
    prev = bytearray(w * bpp)
    for y in range(h):
        filter_type = raw[y * stride]
        curr = bytearray(raw[y * stride + 1 : (y + 1) * stride])
        for x in range(w * bpp):
            a = curr[x - bpp] if x >= bpp else 0
            b = prev[x]
            c = prev[x - bpp] if x >= bpp else 0
            if filter_type == 1: curr[x] = (curr[x] + a) & 0xff
            elif filter_type == 2: curr[x] = (curr[x] + b) & 0xff
            elif filter_type == 3: curr[x] = (curr[x] + ((a + b) >> 1)) & 0xff
            elif filter_type == 4:
                p = a + b - c
                pa, pb, pc = abs(p - a), abs(p - b), abs(p - c)
                pr = a if (pa <= pb and pa <= pc) else (b if pb <= pc else c)
                curr[x] = (curr[x] + pr) & 0xff
        lines.append(curr)
        prev = curr
    return lines

lines = unfilter(raw, w, h, bpp)

# Generate 4x scale crisp PNG
scale = 4
out_w = w * scale
out_h = h * scale
out_raw = bytearray()

for y in range(out_h):
    out_raw.append(0) # filter byte 0 (None)
    src_y = y // scale
    for x in range(out_w):
        src_x = x // scale
        idx = src_x * 4
        pixel = lines[src_y][idx:idx+4]
        out_raw.extend(pixel)

def make_png(raw_bytes, width, height):
    import zlib, binascii
    header = b'\x89PNG\r\n\x1a\n'
    ihdr_data = struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0)
    ihdr_crc = binascii.crc32(b'IHDR' + ihdr_data)
    ihdr = struct.pack('>I4s', len(ihdr_data), b'IHDR') + ihdr_data + struct.pack('>I', ihdr_crc)
    
    compressed = zlib.compress(raw_bytes, 9)
    idat_crc = binascii.crc32(b'IDAT' + compressed)
    idat = struct.pack('>I4s', len(compressed), b'IDAT') + compressed + struct.pack('>I', idat_crc)
    
    iend_crc = binascii.crc32(b'IEND')
    iend = struct.pack('>I4s', 0, b'IEND') + struct.pack('>I', iend_crc)
    return header + ihdr + idat + iend

crisp_png = make_png(out_raw, out_w, out_h)
with open(r'C:\Users\ESMIS 2601\.gemini\antigravity\scratch\proptii-welcome-landing\assets\proptii-logo-crisp.png', 'wb') as f:
    f.write(crisp_png)

print("Saved proptii-logo-crisp.png at 520x208")

# Now generate pixel-perfect SVG icon
icon_svg = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 38 52" fill="none">
  <!-- Proptii Blue House / 'p' Ribbon -->
  <path d="M 17 4 
           L 32 19 
           L 32 35 
           L 25 35 
           L 17 21 
           L 16 24 
           L 16 36 
           L 5 46 
           L 5 24 
           L 17 12 
           Z" 
        fill="#136ea1" />
  <!-- Orange Folded Corner -->
  <polygon points="17,35 25,35 25,29" fill="#ec6711" />
</svg>'''

with open(r'C:\Users\ESMIS 2601\.gemini\antigravity\scratch\proptii-welcome-landing\assets\proptii-icon.svg', 'w', encoding='utf-8') as f:
    f.write(icon_svg)

print("Saved proptii-icon.svg")
