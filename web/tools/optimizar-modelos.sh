#!/bin/zsh
# Optimiza los GLB de Higgsfield (≈45 MB, 500k triángulos) para web: ~60k triángulos,
# texturas webp de 1024 px y compresión meshopt. Uso: tools/optimizar-modelos.sh
cd "$(dirname "$0")/../assets/models" || exit 1
SRC=../../../modelos-3d-originales # originales de Higgsfield, fuera de web/ para que no se publiquen
for pair in cosmo-hunyuan:karaoke mojito-hunyuan:viejoteca gintonic-hunyuan:dj daiquiri-hunyuan:salsa cava-hunyuan:cumple; do
  src=${pair%%:*}; dst=${pair##*:}
  [[ -f $SRC/$src.glb ]] || { echo "falta $SRC/$src.glb"; continue; }
  npx --yes @gltf-transform/cli@4.1.1 optimize $SRC/$src.glb $dst.glb \
    --compress meshopt --texture-compress webp --texture-size 1024 \
    --simplify true --simplify-ratio 0.12 --simplify-error 0.0008 | tail -1
done
