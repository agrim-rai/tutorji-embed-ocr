'use client'

import { useState, useRef } from 'react'
import { useSession } from 'next-auth/react'

export default function TestCombinerPage() {
  const { data: session } = useSession()
  const [selectedFile, setSelectedFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const fileInputRef = useRef(null)

  const handleFileSelect = (event) => {
    const file = event.target.files[0]
    if (file) {
      setSelectedFile(file)
      setError(null)
      setResult(null)
      
      // Create preview URL
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    }
  }

  const handleDragOver = (event) => {
    event.preventDefault()
  }

  const handleDrop = (event) => {
    event.preventDefault()
    const file = event.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file)
      setError(null)
      setResult(null)
      
      // Create preview URL
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    
    if (!selectedFile) {
      setError('Please select an image file')
      return
    }

    if (!session?.user) {
      setError('Please sign in to test the API')
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const formData = new FormData()
      formData.append('image', selectedFile)
      formData.append('userEmail', session.user.email)
      formData.append('pageName', 'test-combiner')

      const response = await fetch('/api/combiner', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (response.ok) {
        setResult(data)
      } else {
        setError(data.error || 'Failed to process image')
      }
    } catch (err) {
      setError('Network error: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const clearFile = () => {
    setSelectedFile(null)
    setPreviewUrl(null)
    setResult(null)
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const getResultColor = (result) => {
    if (!result) return ''
    if (result.details?.newQuestionStored) return 'text-blue-400'
    return 'text-green-400'
  }

  const getResultIcon = (result) => {
    if (!result) return null
    if (result.details?.newQuestionStored) {
      return (
        <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      )
    }
    return (
      <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Combiner API Tester</h1>
          <p className="text-gray-400">
            Test the complete workflow: OCR → Vector Search → Database Lookup → Diagram Check → Image/Text Comparison
          </p>
          {session?.user && (
            <p className="text-sm text-green-400 mt-2">
              Signed in as: {session.user.email}
            </p>
          )}
          {!session?.user && (
            <p className="text-sm text-yellow-400 mt-2">
              Please sign in to test the API
            </p>
          )}
        </div>

        {/* Upload Form */}
        <div className="bg-gray-800 rounded-lg shadow-xl p-6 mb-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* File Upload Area */}
            <div
              className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center hover:border-gray-500 transition-colors cursor-pointer"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              
              {previewUrl ? (
                <div className="space-y-4">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="max-w-xs max-h-64 mx-auto rounded-lg shadow-lg"
                  />
                  <p className="text-sm text-gray-400">
                    {selectedFile?.name} ({(selectedFile?.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      clearFile()
                    }}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Remove Image
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <svg
                    className="w-12 h-12 text-gray-500 mx-auto"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <div>
                    <p className="text-white text-lg">
                      Click to upload or drag and drop an image
                    </p>
                    <p className="text-gray-400 text-sm">
                      PNG, JPG, GIF up to 10MB
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!selectedFile || loading || !session?.user}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Processing...
                </>
              ) : (
                'Test Combiner API'
              )}
            </button>
          </form>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-900/50 border border-red-500 rounded-lg p-4 mb-8">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-red-400 font-medium">Error</span>
            </div>
            <p className="text-red-300 mt-1">{error}</p>
          </div>
        )}

        {/* Results Display */}
        {result && (
          <div className="bg-gray-800 rounded-lg shadow-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              {getResultIcon(result)}
              <h2 className="text-xl font-bold text-white">API Response</h2>
            </div>

            {/* Main Result */}
            <div className="mb-6 p-4 bg-gray-700 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-gray-300 font-medium">Result:</span>
                <span className={`font-bold ${getResultColor(result)}`}>
                  {result.result}
                </span>
              </div>
              <p className="text-gray-300">
                <span className="font-medium">Reason:</span> {result.reason}
              </p>
            </div>

            {/* Detailed Information */}
            {result.details && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">Workflow Details</h3>
                
                {/* Extracted Text */}
                {result.details.extractedText && (
                  <div className="bg-gray-700 p-4 rounded-lg">
                    <h4 className="text-white font-medium mb-2">Step 1: Extracted Text (OCR)</h4>
                    <p className="text-gray-300 text-sm whitespace-pre-wrap max-h-32 overflow-y-auto">
                      {result.details.extractedText || 'No text extracted'}
                    </p>
                  </div>
                )}

                {/* Vector Search Result */}
                {result.details.topResult && (
                  <div className="bg-gray-700 p-4 rounded-lg">
                    <h4 className="text-white font-medium mb-2">Step 2: Vector Search Result</h4>
                    <div className="space-y-2 text-sm">
                      <p className="text-gray-300">
                        <span className="font-medium">Ada ID:</span> {result.details.topResult.id}
                      </p>
                      <p className="text-gray-300">
                        <span className="font-medium">Similarity Score:</span> {result.details.topResult.score?.toFixed(4) || 'N/A'}
                      </p>
                      <p className="text-gray-300">
                        <span className="font-medium">Matched Text:</span>
                      </p>
                      <p className="text-gray-400 whitespace-pre-wrap max-h-24 overflow-y-auto">
                        {result.details.topResult.text || 'No text available'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Diagram Check */}
                {result.details.isDiagram !== undefined && (
                  <div className="bg-gray-700 p-4 rounded-lg">
                    <h4 className="text-white font-medium mb-2">Step 4: Diagram Detection</h4>
                    <p className="text-gray-300">
                      <span className="font-medium">Contains Diagram:</span> {result.details.isDiagram ? 'Yes' : 'No'}
                    </p>
                  </div>
                )}

                {/* Text Comparison */}
                {result.details.textComparison && (
                  <div className="bg-gray-700 p-4 rounded-lg">
                    <h4 className="text-white font-medium mb-2">Step 5: Text Comparison</h4>
                    <div className="space-y-1 text-sm">
                      <p className="text-gray-300">
                        <span className="font-medium">Are Same:</span> {result.details.textComparison.areSame ? 'Yes' : 'No'}
                      </p>
                      <p className="text-gray-300">
                        <span className="font-medium">Confidence:</span> {result.details.textComparison.confidence || 'N/A'}
                      </p>
                      {result.details.textComparison.explanation && (
                        <p className="text-gray-400 text-xs">
                          <span className="font-medium">Explanation:</span> {result.details.textComparison.explanation}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                                 {/* Image Comparison */}
                {result.details.imageComparison && (
                  <div className="bg-gray-700 p-4 rounded-lg">
                    <h4 className="text-white font-medium mb-2">Step 6: Image Comparison</h4>
                    <div className="space-y-1 text-sm">
                      <p className="text-gray-300">
                        <span className="font-medium">Are Same:</span> {result.details.imageComparison.areSame ? 'Yes' : 'No'}
                      </p>
                      <p className="text-gray-300">
                        <span className="font-medium">Confidence:</span> {result.details.imageComparison.confidence || 'N/A'}
                      </p>
                      {result.details.imageComparison.explanation && (
                        <p className="text-gray-400 text-xs">
                          <span className="font-medium">Explanation:</span> {result.details.imageComparison.explanation}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* New Question Storage */}
                {result.details.newQuestionStored && (
                  <div className="bg-blue-900/50 border border-blue-500 p-4 rounded-lg">
                    <h4 className="text-blue-300 font-medium mb-2">✓ New Question Stored</h4>
                    <div className="space-y-1 text-sm">
                      <p className="text-blue-200">
                        <span className="font-medium">New Ada ID:</span> {result.details.newAdaId || result.result}
                      </p>
                      <p className="text-blue-200">
                        <span className="font-medium">Stored in Vector DB:</span> {result.details.extractedText ? 'Yes' : 'No (No text)'}
                      </p>
                      <p className="text-blue-200">
                        <span className="font-medium">Stored in Image DB:</span> Yes
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Raw JSON Response */}
            <details className="mt-6">
              <summary className="text-white font-medium cursor-pointer hover:text-gray-300">
                View Raw JSON Response
              </summary>
              <pre className="mt-2 bg-gray-900 p-4 rounded-lg text-sm text-gray-300 overflow-x-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </details>
          </div>
        )}

        {/* Workflow Explanation */}
        <div className="mt-8 bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4">API Workflow Explanation</h2>
          <div className="space-y-3 text-sm text-gray-300">
            <div className="flex gap-3">
              <span className="bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium">1</span>
              <span><strong>OCR:</strong> Extract text from uploaded image</span>
            </div>
            <div className="flex gap-3">
              <span className="bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium">2</span>
              <span><strong>Vector Search:</strong> Find most similar content in database</span>
            </div>
            <div className="flex gap-3">
              <span className="bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium">3</span>
              <span><strong>Image Retrieval:</strong> Get stored image using Ada ID</span>
            </div>
            <div className="flex gap-3">
              <span className="bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium">4</span>
              <span><strong>Diagram Check:</strong> Determine if image contains diagrams</span>
            </div>
            <div className="flex gap-3">
              <span className="bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium">5</span>
              <span><strong>Comparison:</strong> Compare images (if diagram) or texts then images (if not diagram)</span>
            </div>
            <div className="flex gap-3">
              <span className="bg-green-600 text-white px-2 py-1 rounded text-xs font-medium">✓</span>
              <span><strong>Result:</strong> Return Ada ID if match found, or "NEW QUESTION" if no match</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
