#!/bin/bash

FILE="/home/angelidev/Desktop/luxcity/proptii-r1.1a/src/landlord_agent/src/components/PropertyDetails.tsx"

# 1. Update hero strip to background fade and only cover photo
sed -i 's|{/\* ── Hero photo strip ───────────────────────────────────────────────── \*/}|{/* ── Hero photo strip ───────────────────────────────────────────────── */}\n      {(() => { const coverPhoto = validPhotos.find(p => p.isCover) || validPhotos[0]; return coverPhoto ? (\n        <div className="relative w-full overflow-hidden flex items-center justify-center bg-black/90" style={{ height: 360 }}>\n          <img src={coverPhoto.url} alt="" className="absolute inset-0 w-full h-full object-cover blur-[40px] opacity-40 scale-110" />\n          <img src={coverPhoto.url} alt="Property Cover" className="relative z-10 w-full h-full object-contain" />\n          <button type="button" onClick={() => { document.getElementById("photos-section")?.scrollIntoView({ behavior: "smooth" }); fileInputRef.current?.click(); }}\n            className="absolute z-20 top-4 right-4 flex items-center gap-1.5 text-[12px] font-semibold px-3 py-1.5 rounded-[10px] text-white transition-all hover:bg-white/25"\n            style={{ background: "rgba(0,0,0,0.35)", backdropFilter: "blur(4px)", fontFamily: "Archivo,sans-serif" }}>\n            <Camera size={13} /> Add Photos\n          </button>\n        </div>\n      ) : (|' $FILE

# 2. Remove the old hero block up to the empty state
# We need to be careful with sed here. We will just use awk to replace the block.
