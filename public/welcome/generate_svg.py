# Let us construct the exact SVG coordinates for the Proptii icon mark:
# Dimensions based on 36x48 viewBox:
# Blue shape:
#   Top apex at (18, 4)
#   Slopes down-right to (33, 19)
#   Down to (33, 35)
#   Inner cutout bottom-right corner: (27, 35)
#   Inner cutout slope up to apex at (17, 21)
#   Inner cutout slope down-left to (12, 35)
#   Left stem goes down to (4, 46)
#   Bottom-left diagonal slice: from (4, 46) to (12, 36) or from (4, 46) to (12, 35)
#   Outer left edge: from (4, 23) to (4, 46)
#   Outer roof left slope: from (4, 23) up-right to (18, 4)
# Orange fold triangle:
#   Points: (19, 35), (27, 35), (27, 27)

icon_svg = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 38 50" fill="none">
  <!-- Proptii Blue House / 'p' Mark -->
  <path d="M19 3 L34 18 V36 H28 L19 21 L13 36 H13 V47 L4 37 V22 L19 3Z" fill="#136ea1"/>
  <!-- Orange Folded Triangle inside doorway -->
  <polygon points="19,36 28,36 28,27" fill="#ec6711"/>
</svg>"""

with open(r'C:\Users\ESMIS 2601\.gemini\antigravity\scratch\proptii-welcome-landing\assets\proptii-icon.svg', 'w', encoding='utf-8') as f:
    f.write(icon_svg)

print("Icon SVG created.")
