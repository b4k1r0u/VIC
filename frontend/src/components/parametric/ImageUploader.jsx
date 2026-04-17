/**
 * @fileoverview ImageUploader — drag-and-drop upload for satellite/drone imagery.
 * Used in ParametricInsurance page for the damage AI feature.
 *
 * @param {{
 *   onFile: (file: File) => void,
 *   accept?: string,
 *   label?: string
 * }} props
 */
import React, { useCallback, useRef, useState } from 'react'

export default function ImageUploader({ onFile, accept = 'image/*', label = 'Image satellite / drone' }) {
  const inputRef = useRef(null)
  const [dragging, setDragging] = useState(false)
  const [preview, setPreview] = useState(null)
  const [fileName, setFileName] = useState(null)

  const handleFile = useCallback((file) => {
    if (!file) return
    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = (e) => setPreview(e.target.result)
    reader.readAsDataURL(file)
    onFile(file)
  }, [onFile])

  const onDrop = useCallback((e) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }, [handleFile])

  const onInputChange = (e) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  return (
    <div
      className={`image-uploader ${dragging ? 'dragging' : ''}`}
      style={{
        border: `2px dashed ${dragging ? '#6366f1' : '#334155'}`,
        borderRadius: 12, padding: 24, textAlign: 'center',
        background: dragging ? 'rgba(99,102,241,0.06)' : '#0f172a',
        cursor: 'pointer', transition: 'all 0.2s',
        position: 'relative', overflow: 'hidden',
      }}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        style={{ display: 'none' }}
        onChange={onInputChange}
      />

      {preview ? (
        <>
          <img
            src={preview}
            alt="Aperçu"
            style={{ maxHeight: 160, maxWidth: '100%', borderRadius: 8, marginBottom: 10 }}
          />
          <p style={{ fontSize: 12, color: '#64748b' }}>{fileName}</p>
          <p style={{ fontSize: 11, color: '#475569' }}>Cliquez pour changer</p>
        </>
      ) : (
        <>
          <div style={{ fontSize: 36, marginBottom: 10 }}>🛰️</div>
          <p style={{ color: '#94a3b8', fontSize: 14, fontWeight: 600 }}>{label}</p>
          <p style={{ color: '#475569', fontSize: 12, marginTop: 4 }}>
            Glissez un fichier ici ou cliquez pour parcourir
          </p>
          <p style={{ color: '#334155', fontSize: 11, marginTop: 8 }}>
            PNG, JPG, TIFF — max 50 MB
          </p>
        </>
      )}
    </div>
  )
}
