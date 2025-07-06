
"use client"

import { useState, useEffect, useCallback } from 'react'
import * as tf from '@tensorflow/tfjs'

interface ClassificationResult {
  className: string
  probability: number
}

export const useWasteClassifier = () => {
  const [model, setModel] = useState<tf.GraphModel | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadModel = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        // Load your trained model from Teachable Machine
        const modelUrl = 'https://teachablemachine.withgoogle.com/models/7WCBx_TNQ/'
        const loadedModel = await tf.loadGraphModel(modelUrl + 'model.json')
        
        setModel(loadedModel)
      } catch (err) {
        console.error('Error loading AI model:', err)
        setError('Failed to load AI model')
      } finally {
        setIsLoading(false)
      }
    }

    loadModel()
  }, [])

  const classifyImage = useCallback(async (imageElement: HTMLImageElement): Promise<ClassificationResult | null> => {
    if (!model) {
      console.warn('Model not loaded yet')
      return null
    }

    try {
      // Preprocess the image
      const tensor = tf.browser.fromPixels(imageElement)
        .resizeNearestNeighbor([224, 224]) // Teachable Machine uses 224x224
        .toFloat()
        .div(255.0)
        .expandDims(0)

      // Make prediction
      const predictions = await model.predict(tensor) as tf.Tensor
      const probabilities = await predictions.data()
      
      // Clean up tensors
      tensor.dispose()
      predictions.dispose()

      // Get the highest probability class
      const maxProbability = Math.max(...Array.from(probabilities))
      const predictedClassIndex = Array.from(probabilities).indexOf(maxProbability)
      
      // Map to your waste categories (adjust these based on your training labels)
      const classNames = ['dry-waste', 'e-waste', 'reusable', 'hazardous']
      const displayNames = ['Dry Waste', 'E-Waste', 'Reusable Items', 'Hazardous Waste']
      
      return {
        className: classNames[predictedClassIndex] || 'dry-waste',
        probability: maxProbability
      }
    } catch (err) {
      console.error('Error during classification:', err)
      return null
    }
  }, [model])

  return {
    model,
    isLoading,
    error,
    classifyImage
  }
}
