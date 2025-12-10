import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ALGORITHM_GROUPS = {
  basic: {
    name: 'Basic',
    description: 'Simple approaches for clean, bold patterns',
    algorithms: {
      threshold: {
        name: 'Simple',
        description: 'Basic light/dark cutoff. Best for high-contrast images.',
        defaults: { threshold: 128, contrast: 100, brightness: 100 }
      },
      otsu: {
        name: 'Auto',
        description: 'Automatically finds the best cutoff point.',
        defaults: { contrast: 110, brightness: 100 }
      }
    }
  },
  dithering: {
    name: 'Dithering',
    description: 'Creates texture using dot patterns for more detail',
    algorithms: {
      floydSteinberg: {
        name: 'Floyd-Steinberg',
        description: 'Classic dithering with smooth gradients. Great for photos.',
        defaults: { threshold: 128, ditherStrength: 100, contrast: 100, brightness: 100 }
      },
      atkinson: {
        name: 'Atkinson',
        description: 'Lighter dithering, preserves highlights. Retro Mac look.',
        defaults: { threshold: 128, ditherStrength: 100, contrast: 110, brightness: 105 }
      },
      ordered: {
        name: 'Ordered',
        description: 'Regular dot pattern. Clean, geometric look.',
        defaults: { threshold: 128, ditherStrength: 80, contrast: 100, brightness: 100 }
      }
    }
  },
  advanced: {
    name: 'Advanced',
    description: 'Specialized techniques for specific needs',
    algorithms: {
      adaptive: {
        name: 'Adaptive',
        description: 'Adjusts locally for uneven lighting. Good for photos with shadows.',
        defaults: { threshold: 128, adaptiveBlockSize: 11, contrast: 100, brightness: 100 }
      },
      sobel: {
        name: 'Edges Only',
        description: 'Shows only outlines. Great for line art or coloring patterns.',
        defaults: { edgeSensitivity: 40, contrast: 120, brightness: 100 }
      }
    }
  }
};

function CropTool({ imagePreview, crop, setCrop, onReset }) {
  const containerRef = useRef(null);
  const [dragging, setDragging] = useState(null);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [startCrop, setStartCrop] = useState(null);

  const getRelativePosition = (e) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)),
      y: Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height))
    };
  };

  const handleMouseDown = (e, handle) => {
    e.preventDefault();
    e.stopPropagation();
    const pos = getRelativePosition(e);
    setDragging(handle);
    setStartPos(pos);
    setStartCrop({ ...crop });
  };

  useEffect(() => {
    if (!dragging) return;

    const handleMouseMove = (e) => {
      if (!containerRef.current || !startCrop) return;
      
      const pos = getRelativePosition(e);
      const dx = pos.x - startPos.x;
      const dy = pos.y - startPos.y;

      setCrop(() => {
        let { x1, y1, x2, y2 } = startCrop;
        
        if (dragging === 'move') {
          const w = x2 - x1;
          const h = y2 - y1;
          x1 = Math.max(0, Math.min(1 - w, startCrop.x1 + dx));
          y1 = Math.max(0, Math.min(1 - h, startCrop.y1 + dy));
          return { x1, y1, x2: x1 + w, y2: y1 + h };
        }
        
        if (dragging.includes('l')) x1 = Math.max(0, Math.min(x2 - 0.05, startCrop.x1 + dx));
        if (dragging.includes('r')) x2 = Math.max(x1 + 0.05, Math.min(1, startCrop.x2 + dx));
        if (dragging.includes('t')) y1 = Math.max(0, Math.min(y2 - 0.05, startCrop.y1 + dy));
        if (dragging.includes('b')) y2 = Math.max(y1 + 0.05, Math.min(1, startCrop.y2 + dy));
        
        return { x1, y1, x2, y2 };
      });
    };

    const handleMouseUp = () => {
      setDragging(null);
      setStartCrop(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragging, startPos, startCrop, setCrop]);

  const Handle = ({ position, cursor, style }) => (
    <div
      onMouseDown={(e) => handleMouseDown(e, position)}
      style={{
        position: 'absolute',
        width: '14px',
        height: '14px',
        backgroundColor: '#fff',
        border: '2px solid #000',
        borderRadius: '3px',
        cursor: cursor,
        zIndex: 20,
        transform: 'translate(-50%, -50%)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.5)',
        ...style
      }}
    />
  );

  return (
    <div 
      ref={containerRef}
      style={{ position: 'relative', width: '100%', userSelect: 'none' }}
    >
      <img 
        src={imagePreview} 
        alt="" 
        draggable={false}
        style={{ width: '100%', display: 'block', borderRadius: '4px' }} 
      />
      
      {/* Darkened overlays */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: `${crop.y1 * 100}%`, backgroundColor: 'rgba(0,0,0,0.7)' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: `${(1 - crop.y2) * 100}%`, backgroundColor: 'rgba(0,0,0,0.7)' }} />
        <div style={{ position: 'absolute', top: `${crop.y1 * 100}%`, bottom: `${(1 - crop.y2) * 100}%`, left: 0, width: `${crop.x1 * 100}%`, backgroundColor: 'rgba(0,0,0,0.7)' }} />
        <div style={{ position: 'absolute', top: `${crop.y1 * 100}%`, bottom: `${(1 - crop.y2) * 100}%`, right: 0, width: `${(1 - crop.x2) * 100}%`, backgroundColor: 'rgba(0,0,0,0.7)' }} />
      </div>

      {/* Crop area - draggable center */}
      <div
        onMouseDown={(e) => handleMouseDown(e, 'move')}
        style={{
          position: 'absolute',
          left: `${crop.x1 * 100}%`,
          top: `${crop.y1 * 100}%`,
          width: `${(crop.x2 - crop.x1) * 100}%`,
          height: `${(crop.y2 - crop.y1) * 100}%`,
          border: '2px solid #fff',
          boxShadow: '0 0 0 1px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(255,255,255,0.2)',
          cursor: 'move',
          zIndex: 10
        }}
      >
        {/* Grid lines */}
        <div style={{ position: 'absolute', left: '33.33%', top: 0, bottom: 0, width: '1px', backgroundColor: 'rgba(255,255,255,0.4)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', left: '66.66%', top: 0, bottom: 0, width: '1px', backgroundColor: 'rgba(255,255,255,0.4)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: '33.33%', left: 0, right: 0, height: '1px', backgroundColor: 'rgba(255,255,255,0.4)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: '66.66%', left: 0, right: 0, height: '1px', backgroundColor: 'rgba(255,255,255,0.4)', pointerEvents: 'none' }} />
      </div>

      {/* Corner handles */}
      <Handle position="tl" cursor="nw-resize" style={{ left: `${crop.x1 * 100}%`, top: `${crop.y1 * 100}%` }} />
      <Handle position="tr" cursor="ne-resize" style={{ left: `${crop.x2 * 100}%`, top: `${crop.y1 * 100}%` }} />
      <Handle position="bl" cursor="sw-resize" style={{ left: `${crop.x1 * 100}%`, top: `${crop.y2 * 100}%` }} />
      <Handle position="br" cursor="se-resize" style={{ left: `${crop.x2 * 100}%`, top: `${crop.y2 * 100}%` }} />
      
      {/* Edge handles */}
      <Handle position="t" cursor="n-resize" style={{ left: `${(crop.x1 + crop.x2) / 2 * 100}%`, top: `${crop.y1 * 100}%` }} />
      <Handle position="b" cursor="s-resize" style={{ left: `${(crop.x1 + crop.x2) / 2 * 100}%`, top: `${crop.y2 * 100}%` }} />
      <Handle position="l" cursor="w-resize" style={{ left: `${crop.x1 * 100}%`, top: `${(crop.y1 + crop.y2) / 2 * 100}%` }} />
      <Handle position="r" cursor="e-resize" style={{ left: `${crop.x2 * 100}%`, top: `${(crop.y1 + crop.y2) / 2 * 100}%` }} />
    </div>
  );
}

export default function CrochetPatternGenerator() {
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [gridWidth, setGridWidth] = useState(50);
  const [gridHeight, setGridHeight] = useState(50);
  const [threshold, setThreshold] = useState(128);
  const [pattern, setPattern] = useState([]);
  const [aspectLock, setAspectLock] = useState(true);
  const [originalAspect, setOriginalAspect] = useState(1);
  const [invertColors, setInvertColors] = useState(false);
  const [algorithm, setAlgorithm] = useState('threshold');
  const [contrast, setContrast] = useState(100);
  const [brightness, setBrightness] = useState(100);
  const [edgeSensitivity, setEdgeSensitivity] = useState(40);
  const [adaptiveBlockSize, setAdaptiveBlockSize] = useState(11);
  const [ditherStrength, setDitherStrength] = useState(100);
  const [crop, setCrop] = useState({ x1: 0, y1: 0, x2: 1, y2: 1 });
  const [cropPanelOpen, setCropPanelOpen] = useState(true);
  const [imageVersion, setImageVersion] = useState(0);
  
  const canvasRef = useRef(null);
  const previewRef = useRef(null);
  const containerRef = useRef(null);

  const resetCrop = () => setCrop({ x1: 0, y1: 0, x2: 1, y2: 1 });

  const applyPreset = (algo) => {
    setAlgorithm(algo);
    for (const group of Object.values(ALGORITHM_GROUPS)) {
      if (group.algorithms[algo]) {
        const defaults = group.algorithms[algo].defaults;
        if (defaults.threshold !== undefined) setThreshold(defaults.threshold);
        if (defaults.contrast !== undefined) setContrast(defaults.contrast);
        if (defaults.brightness !== undefined) setBrightness(defaults.brightness);
        if (defaults.ditherStrength !== undefined) setDitherStrength(defaults.ditherStrength);
        if (defaults.edgeSensitivity !== undefined) setEdgeSensitivity(defaults.edgeSensitivity);
        if (defaults.adaptiveBlockSize !== undefined) setAdaptiveBlockSize(defaults.adaptiveBlockSize);
        break;
      }
    }
  };

  const getAlgorithmInfo = (algo) => {
    for (const group of Object.values(ALGORITHM_GROUPS)) {
      if (group.algorithms[algo]) return group.algorithms[algo];
    }
    return null;
  };

  const drawPattern = useCallback(() => {
    if (pattern.length === 0 || !previewRef.current || !containerRef.current) return;
    
    const container = containerRef.current;
    const preview = previewRef.current;
    const ctx = preview.getContext('2d');
    
    const availW = container.offsetWidth;
    const availH = container.offsetHeight;
    
    const gridAspect = gridWidth / gridHeight;
    const containerAspect = availW / availH;
    
    let canvasW, canvasH, cellSize;
    if (gridAspect > containerAspect) {
      canvasW = availW;
      cellSize = canvasW / gridWidth;
      canvasH = cellSize * gridHeight;
    } else {
      canvasH = availH;
      cellSize = canvasH / gridHeight;
      canvasW = cellSize * gridWidth;
    }
    
    preview.width = canvasW;
    preview.height = canvasH;
    
    for (let y = 0; y < pattern.length; y++) {
      for (let x = 0; x < pattern[y].length; x++) {
        ctx.fillStyle = pattern[y][x] === 1 ? '#e0e0e0' : '#0a0a0a';
        ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
      }
    }
    
    if (cellSize > 3) {
      ctx.strokeStyle = '#1a1a1a';
      ctx.lineWidth = 0.5;
      for (let y = 0; y <= gridHeight; y++) {
        ctx.beginPath(); ctx.moveTo(0, y * cellSize); ctx.lineTo(canvasW, y * cellSize); ctx.stroke();
      }
      for (let x = 0; x <= gridWidth; x++) {
        ctx.beginPath(); ctx.moveTo(x * cellSize, 0); ctx.lineTo(x * cellSize, canvasH); ctx.stroke();
      }
    }
    
    ctx.strokeStyle = '#444';
    ctx.lineWidth = cellSize > 3 ? 1.5 : 1;
    for (let x = 10; x < gridWidth; x += 10) {
      ctx.beginPath(); ctx.moveTo(x * cellSize, 0); ctx.lineTo(x * cellSize, canvasH); ctx.stroke();
    }
    for (let y = 10; y < gridHeight; y += 10) {
      ctx.beginPath(); ctx.moveTo(0, y * cellSize); ctx.lineTo(canvasW, y * cellSize); ctx.stroke();
    }
  }, [pattern, gridWidth, gridHeight]);

  useEffect(() => {
    drawPattern();
    const handleResize = () => drawPattern();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [drawPattern]);

  const handleImageUpload = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      setImagePreview(dataUrl);
      setCrop({ x1: 0, y1: 0, x2: 1, y2: 1 });
      
      const img = new Image();
      img.onload = () => {
        setImage(img);
        const asp = img.width / img.height;
        setOriginalAspect(asp);
        if (aspectLock) {
          setGridHeight(Math.round(gridWidth / asp));
        }
        // Trigger re-render to force pattern generation
        setImageVersion(v => v + 1);
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleWidthChange = (v) => {
    const w = Math.max(10, Math.min(200, v));
    setGridWidth(w);
    if (aspectLock && originalAspect) setGridHeight(Math.round(w / originalAspect));
  };

  const handleHeightChange = (v) => {
    const h = Math.max(10, Math.min(200, v));
    setGridHeight(h);
    if (aspectLock && originalAspect) setGridWidth(Math.round(h * originalAspect));
  };

  const applyContrastBrightness = (data) => {
    const c = contrast / 100;
    const b = (brightness - 100) * 2.55;
    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.min(255, Math.max(0, (data[i] - 128) * c + 128 + b));
      data[i+1] = Math.min(255, Math.max(0, (data[i+1] - 128) * c + 128 + b));
      data[i+2] = Math.min(255, Math.max(0, (data[i+2] - 128) * c + 128 + b));
    }
  };

  const getGrayscale = (data, i) => 0.299 * data[i] + 0.587 * data[i+1] + 0.114 * data[i+2];

  const otsuThreshold = (grayscaleArr) => {
    const hist = new Array(256).fill(0);
    grayscaleArr.forEach(v => hist[Math.round(v)]++);
    const total = grayscaleArr.length;
    let sum = 0;
    for (let i = 0; i < 256; i++) sum += i * hist[i];
    let sumB = 0, wB = 0, max = 0, thresh = 0;
    for (let i = 0; i < 256; i++) {
      wB += hist[i];
      if (wB === 0) continue;
      const wF = total - wB;
      if (wF === 0) break;
      sumB += i * hist[i];
      const mB = sumB / wB;
      const mF = (sum - sumB) / wF;
      const between = wB * wF * (mB - mF) * (mB - mF);
      if (between > max) { max = between; thresh = i; }
    }
    return thresh;
  };

  const generatePattern = useCallback(() => {
    if (!image) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Apply crop
    const sx = crop.x1 * image.width;
    const sy = crop.y1 * image.height;
    const sw = (crop.x2 - crop.x1) * image.width;
    const sh = (crop.y2 - crop.y1) * image.height;
    
    canvas.width = gridWidth;
    canvas.height = gridHeight;
    ctx.drawImage(image, sx, sy, sw, sh, 0, 0, gridWidth, gridHeight);
    const imageData = ctx.getImageData(0, 0, gridWidth, gridHeight);
    const data = imageData.data;
    
    applyContrastBrightness(data);
    
    const gray = [];
    for (let i = 0; i < data.length; i += 4) gray.push(getGrayscale(data, i));
    
    let result = [];
    const strength = ditherStrength / 100;

    switch (algorithm) {
      case 'otsu': {
        const t = otsuThreshold(gray);
        result = gray.map(g => g < t ? 1 : 0);
        break;
      }
      case 'floydSteinberg': {
        const err = [...gray];
        for (let y = 0; y < gridHeight; y++) {
          for (let x = 0; x < gridWidth; x++) {
            const idx = y * gridWidth + x;
            const old = err[idx];
            const newVal = old < threshold ? 0 : 255;
            result.push(newVal === 0 ? 1 : 0);
            const quant = (old - newVal) * strength;
            if (x + 1 < gridWidth) err[idx + 1] += quant * 7/16;
            if (y + 1 < gridHeight) {
              if (x > 0) err[idx + gridWidth - 1] += quant * 3/16;
              err[idx + gridWidth] += quant * 5/16;
              if (x + 1 < gridWidth) err[idx + gridWidth + 1] += quant * 1/16;
            }
          }
        }
        break;
      }
      case 'atkinson': {
        const err = [...gray];
        for (let y = 0; y < gridHeight; y++) {
          for (let x = 0; x < gridWidth; x++) {
            const idx = y * gridWidth + x;
            const old = err[idx];
            const newVal = old < threshold ? 0 : 255;
            result.push(newVal === 0 ? 1 : 0);
            const quant = (old - newVal) * strength / 8;
            if (x + 1 < gridWidth) err[idx + 1] += quant;
            if (x + 2 < gridWidth) err[idx + 2] += quant;
            if (y + 1 < gridHeight) {
              if (x > 0) err[idx + gridWidth - 1] += quant;
              err[idx + gridWidth] += quant;
              if (x + 1 < gridWidth) err[idx + gridWidth + 1] += quant;
            }
            if (y + 2 < gridHeight) err[idx + gridWidth * 2] += quant;
          }
        }
        break;
      }
      case 'ordered': {
        const bayer = [[0,8,2,10],[12,4,14,6],[3,11,1,9],[15,7,13,5]];
        result = gray.map((g, i) => {
          const x = i % gridWidth, y = Math.floor(i / gridWidth);
          const t = threshold + (bayer[y % 4][x % 4] / 16 - 0.5) * 128 * (ditherStrength / 100);
          return g < t ? 1 : 0;
        });
        break;
      }
      case 'sobel': {
        const sens = edgeSensitivity * 2;
        for (let y = 0; y < gridHeight; y++) {
          for (let x = 0; x < gridWidth; x++) {
            if (x === 0 || x === gridWidth-1 || y === 0 || y === gridHeight-1) {
              result.push(0); continue;
            }
            const idx = (i) => gray[i];
            const i = y * gridWidth + x;
            const gx = -idx(i-gridWidth-1) + idx(i-gridWidth+1) - 2*idx(i-1) + 2*idx(i+1) - idx(i+gridWidth-1) + idx(i+gridWidth+1);
            const gy = -idx(i-gridWidth-1) - 2*idx(i-gridWidth) - idx(i-gridWidth+1) + idx(i+gridWidth-1) + 2*idx(i+gridWidth) + idx(i+gridWidth+1);
            const mag = Math.sqrt(gx*gx + gy*gy);
            result.push(mag > sens ? 1 : 0);
          }
        }
        break;
      }
      case 'adaptive': {
        const bs = Math.max(3, adaptiveBlockSize | 1);
        const half = Math.floor(bs / 2);
        for (let y = 0; y < gridHeight; y++) {
          for (let x = 0; x < gridWidth; x++) {
            let sum = 0, count = 0;
            for (let dy = -half; dy <= half; dy++) {
              for (let dx = -half; dx <= half; dx++) {
                const ny = y + dy, nx = x + dx;
                if (ny >= 0 && ny < gridHeight && nx >= 0 && nx < gridWidth) {
                  sum += gray[ny * gridWidth + nx];
                  count++;
                }
              }
            }
            const localMean = sum / count;
            const idx = y * gridWidth + x;
            result.push(gray[idx] < localMean - (threshold - 128) / 4 ? 1 : 0);
          }
        }
        break;
      }
      default:
        result = gray.map(g => g < threshold ? 1 : 0);
    }

    if (invertColors) result = result.map(v => 1 - v);
    
    const pat = [];
    for (let y = 0; y < gridHeight; y++) {
      pat.push(result.slice(y * gridWidth, (y + 1) * gridWidth));
    }
    setPattern(pat);
  }, [image, gridWidth, gridHeight, threshold, invertColors, algorithm, contrast, brightness, edgeSensitivity, adaptiveBlockSize, ditherStrength, crop]);

  // Generate pattern when dependencies change
  useEffect(() => { 
    if (image) generatePattern(); 
  }, [image, generatePattern, imageVersion]);

  const downloadCSV = () => {
    if (pattern.length === 0) return;
    const csv = pattern.map(row => row.map(c => c === 1 ? 'X' : 'O').join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `crochet_pattern_${gridWidth}x${gridHeight}.csv`;
    a.click();
  };

  const stitches = pattern.length > 0 
    ? { black: pattern.flat().filter(x => x === 1).length, total: gridWidth * gridHeight }
    : { black: 0, total: 0 };

  const showThreshold = ['threshold', 'floydSteinberg', 'atkinson', 'ordered', 'adaptive'].includes(algorithm);
  const showDither = ['floydSteinberg', 'atkinson', 'ordered'].includes(algorithm);
  const showEdge = algorithm === 'sobel';
  const showAdaptive = algorithm === 'adaptive';

  const currentAlgoInfo = getAlgorithmInfo(algorithm);
  const isCropped = crop.x1 > 0.01 || crop.y1 > 0.01 || crop.x2 < 0.99 || crop.y2 < 0.99;

  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', backgroundColor: '#0a0a0a', color: '#ddd', height: '100vh', width: '100vw', display: 'flex', overflow: 'hidden', position: 'fixed', top: 0, left: 0 }}>
      {/* Sidebar */}
      <aside style={{ width: '280px', flexShrink: 0, borderRight: '1px solid #1a1a1a', height: '100%', overflowY: 'auto', backgroundColor: '#0d0d0d' }}>
        <div style={{ padding: '16px', borderBottom: '1px solid #1a1a1a' }}>
          <h1 style={{ fontSize: '16px', fontWeight: '600', margin: '0 0 4px 0', color: '#fff' }}>🧶 Crochet Pattern</h1>
          <p style={{ fontSize: '11px', color: '#666', margin: 0 }}>Convert images to stitch patterns</p>
        </div>

        {/* Image Upload */}
        <div style={{ padding: '16px', borderBottom: '1px solid #1a1a1a' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: '600', color: '#999' }}>1. Choose Image</label>
          <div
            onClick={() => document.getElementById('fileInput').click()}
            onDrop={(e) => { e.preventDefault(); handleImageUpload(e.dataTransfer.files[0]); }}
            onDragOver={(e) => e.preventDefault()}
            style={{ border: '2px dashed #333', borderRadius: '8px', padding: '12px', textAlign: 'center', cursor: 'pointer', backgroundColor: '#111', transition: 'border-color 0.2s' }}
            onMouseOver={(e) => e.currentTarget.style.borderColor = '#555'}
            onMouseOut={(e) => e.currentTarget.style.borderColor = '#333'}
          >
            <input id="fileInput" type="file" accept="image/*" onChange={(e) => handleImageUpload(e.target.files[0])} style={{ display: 'none' }} />
            {imagePreview ? (
              <img src={imagePreview} alt="" style={{ maxWidth: '100%', maxHeight: '80px', borderRadius: '4px' }} />
            ) : (
              <div style={{ padding: '20px 0' }}>
                <div style={{ fontSize: '24px', marginBottom: '8px' }}>📷</div>
                <div style={{ color: '#666', fontSize: '12px' }}>Drop image here or click to browse</div>
              </div>
            )}
          </div>
          {imagePreview && (
            <button onClick={() => { setImage(null); setImagePreview(null); setPattern([]); resetCrop(); }} style={{ marginTop: '8px', width: '100%', padding: '6px', background: 'none', border: '1px solid #333', borderRadius: '6px', color: '#888', fontSize: '11px', cursor: 'pointer' }}>
              Remove Image
            </button>
          )}
        </div>

        {/* Style Selection */}
        <div style={{ padding: '16px', borderBottom: '1px solid #1a1a1a' }}>
          <label style={{ display: 'block', marginBottom: '12px', fontSize: '12px', fontWeight: '600', color: '#999' }}>2. Choose Style</label>
          {Object.entries(ALGORITHM_GROUPS).map(([groupKey, group]) => (
            <div key={groupKey} style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '10px', fontWeight: '600', color: '#555', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.5px' }}>{group.name}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {Object.entries(group.algorithms).map(([algoKey, algo]) => (
                  <motion.button
                    key={algoKey}
                    onClick={() => applyPreset(algoKey)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    style={{
                      padding: '8px 12px',
                      backgroundColor: algorithm === algoKey ? '#fff' : '#1a1a1a',
                      color: algorithm === algoKey ? '#000' : '#aaa',
                      border: algorithm === algoKey ? '1px solid #fff' : '1px solid #333',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'all 0.15s'
                    }}
                  >
                    {algo.name}
                  </motion.button>
                ))}
              </div>
            </div>
          ))}
          {currentAlgoInfo && (
            <div style={{ marginTop: '12px', padding: '10px', backgroundColor: '#151515', borderRadius: '6px', fontSize: '11px', color: '#888', lineHeight: '1.4' }}>
              💡 {currentAlgoInfo.description}
            </div>
          )}
        </div>

        {/* Size Controls */}
        <div style={{ padding: '16px', borderBottom: '1px solid #1a1a1a' }}>
          <label style={{ display: 'block', marginBottom: '12px', fontSize: '12px', fontWeight: '600', color: '#999' }}>3. Pattern Size</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '10px', color: '#666' }}>Width: {gridWidth}</label>
              <input type="range" min="20" max="200" value={gridWidth} onChange={(e) => handleWidthChange(+e.target.value)} style={{ width: '100%', accentColor: '#888' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '10px', color: '#666' }}>Height: {gridHeight}</label>
              <input type="range" min="20" max="200" value={gridHeight} onChange={(e) => handleHeightChange(+e.target.value)} style={{ width: '100%', accentColor: '#888' }} />
            </div>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '11px', color: '#888' }}>
            <input type="checkbox" checked={aspectLock} onChange={(e) => setAspectLock(e.target.checked)} style={{ accentColor: '#888' }} />
            Keep proportions
          </label>
        </div>

        {/* Fine Tuning */}
        <div style={{ padding: '16px', borderBottom: '1px solid #1a1a1a' }}>
          <label style={{ display: 'block', marginBottom: '12px', fontSize: '12px', fontWeight: '600', color: '#999' }}>4. Fine Tune</label>
          
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '10px', color: '#666' }}>Contrast: {contrast}%</label>
            <input type="range" min="50" max="200" value={contrast} onChange={(e) => setContrast(+e.target.value)} style={{ width: '100%', accentColor: '#888' }} />
          </div>
          
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '10px', color: '#666' }}>Brightness: {brightness}%</label>
            <input type="range" min="50" max="150" value={brightness} onChange={(e) => setBrightness(+e.target.value)} style={{ width: '100%', accentColor: '#888' }} />
          </div>

          {showThreshold && (
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '10px', color: '#666' }}>Light/Dark Balance: {threshold}</label>
              <input type="range" min="0" max="255" value={threshold} onChange={(e) => setThreshold(+e.target.value)} style={{ width: '100%', accentColor: '#888' }} />
            </div>
          )}

          {showDither && (
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '10px', color: '#666' }}>Texture Amount: {ditherStrength}%</label>
              <input type="range" min="0" max="200" value={ditherStrength} onChange={(e) => setDitherStrength(+e.target.value)} style={{ width: '100%', accentColor: '#888' }} />
            </div>
          )}

          {showEdge && (
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '10px', color: '#666' }}>Edge Detail: {edgeSensitivity}</label>
              <input type="range" min="10" max="100" value={edgeSensitivity} onChange={(e) => setEdgeSensitivity(+e.target.value)} style={{ width: '100%', accentColor: '#888' }} />
            </div>
          )}

          {showAdaptive && (
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '10px', color: '#666' }}>Sample Area: {adaptiveBlockSize}px</label>
              <input type="range" min="3" max="31" step="2" value={adaptiveBlockSize} onChange={(e) => setAdaptiveBlockSize(+e.target.value)} style={{ width: '100%', accentColor: '#888' }} />
            </div>
          )}

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '11px', color: '#888' }}>
            <input type="checkbox" checked={invertColors} onChange={(e) => setInvertColors(e.target.checked)} style={{ accentColor: '#888' }} />
            Swap black & white
          </label>
        </div>

        {/* Stats & Download */}
        {pattern.length > 0 && (
          <div style={{ padding: '16px' }}>
            <div style={{ padding: '12px', backgroundColor: '#111', borderRadius: '8px', marginBottom: '12px' }}>
              <div style={{ fontSize: '10px', color: '#666', marginBottom: '8px', textTransform: 'uppercase' }}>Stitch Count</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                <span><strong style={{ color: '#fff' }}>{stitches.black}</strong> <span style={{ color: '#666' }}>dark (X)</span></span>
                <span><strong style={{ color: '#fff' }}>{stitches.total - stitches.black}</strong> <span style={{ color: '#666' }}>light (O)</span></span>
              </div>
              <div style={{ fontSize: '11px', color: '#555', marginTop: '6px' }}>
                Total: {stitches.total} stitches ({gridWidth} × {gridHeight})
              </div>
            </div>
            
            <motion.button 
              onClick={downloadCSV}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              style={{ 
                width: '100%', 
                padding: '14px', 
                backgroundColor: '#fff', 
                color: '#000', 
                border: 'none', 
                borderRadius: '8px', 
                fontSize: '13px', 
                fontWeight: '600', 
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              ⬇️ Download Pattern (CSV)
            </motion.button>
            <p style={{ fontSize: '10px', color: '#555', marginTop: '8px', textAlign: 'center' }}>
              Opens in Excel/Google Sheets. X = dark, O = light.
            </p>
          </div>
        )}
      </aside>

      {/* Main area */}
      <main 
        ref={containerRef} 
        style={{ 
          flex: 1,
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0a0a0a',
          position: 'relative'
        }}
      >
        <canvas ref={canvasRef} style={{ display: 'none' }} />
        
        {/* Crop Panel */}
        {imagePreview && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              width: cropPanelOpen ? '300px' : 'auto',
              backgroundColor: '#111',
              border: '1px solid #2a2a2a',
              borderRadius: '12px',
              overflow: 'hidden',
              zIndex: 100,
              boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
            }}
          >
            <div 
              onClick={() => setCropPanelOpen(!cropPanelOpen)}
              style={{ 
                padding: '12px 16px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                cursor: 'pointer',
                borderBottom: cropPanelOpen ? '1px solid #2a2a2a' : 'none',
                backgroundColor: '#151515'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>✂️</span>
                <span style={{ fontSize: '12px', fontWeight: '600' }}>Crop Image</span>
                {isCropped && <span style={{ fontSize: '9px', backgroundColor: '#3b82f6', padding: '2px 6px', borderRadius: '4px', color: '#fff' }}>Active</span>}
              </div>
              <span style={{ fontSize: '14px', color: '#666' }}>{cropPanelOpen ? '▲' : '▼'}</span>
            </div>
            
            <AnimatePresence>
              {cropPanelOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  style={{ overflow: 'hidden' }}
                >
                  <div style={{ padding: '12px' }}>
                    <CropTool 
                      imagePreview={imagePreview} 
                      crop={crop} 
                      setCrop={setCrop}
                      onReset={resetCrop}
                    />
                    <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                      <button
                        onClick={resetCrop}
                        disabled={!isCropped}
                        style={{
                          flex: 1,
                          padding: '8px',
                          backgroundColor: isCropped ? '#2a2a2a' : '#1a1a1a',
                          border: '1px solid #333',
                          borderRadius: '6px',
                          color: isCropped ? '#fff' : '#555',
                          fontSize: '11px',
                          cursor: isCropped ? 'pointer' : 'default'
                        }}
                      >
                        Reset Crop
                      </button>
                    </div>
                    <p style={{ fontSize: '10px', color: '#555', marginTop: '10px', lineHeight: '1.4' }}>
                      Drag corners or edges to crop. Drag center to move.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {pattern.length > 0 ? (
            <motion.canvas
              ref={previewRef}
              key="pattern"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
          ) : (
            <motion.div 
              key="empty" 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              style={{ textAlign: 'center', padding: '40px' }}
            >
              <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.3 }}>🧶</div>
              <div style={{ color: '#444', fontSize: '14px' }}>Upload an image to get started</div>
              <div style={{ color: '#333', fontSize: '12px', marginTop: '8px' }}>Your pattern will appear here</div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}