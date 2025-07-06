
"use client"

import { useState, useEffect } from "react"
import * as tf from "@tensorflow/tfjs"

interface ClassificationResult {
  category: string
  confidence: number
  suggestions: string[]
}

export const useWasteClassifier = () => {
  const [model, setModel] = useState<tf.LayersModel | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadModel = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        // Load your trained model from Teachable Machine
        const modelUrl = 'https://teachablemachine.withgoogle.com/models/7WCBx_TNQ/'
        const loadedModel = await tf.loadLayersModel(modelUrl + 'model.json')
        
        setModel(loadedModel)
      } catch (err) {
        console.error("Error loading AI model:", err)
        setError("Failed to load AI model")
      } finally {
        setIsLoading(false)
      }
    }

    loadModel()
  }, [])

  const classifyWaste = async (imageElement: HTMLImageElement): Promise<ClassificationResult> => {
    if (!model) {
      throw new Error("Model not loaded")
    }

    if (!imageElement.complete) {
      throw new Error("Image not loaded")
    }

    try {
      // Preprocess the image for Teachable Machine
      const tensor = tf.browser.fromPixels(imageElement)
        .resizeNearestNeighbor([224, 224]) // Teachable Machine uses 224x224
        .toFloat()
        .div(255.0) // Normalize to 0-1
        .expandDims(0)

      // Make prediction
      const predictions = model.predict(tensor) as tf.Tensor
      const probabilities = await predictions.data()
      
      // Clean up tensors
      tensor.dispose()
      predictions.dispose()

      // Define the class labels (adjust based on your model)
      const labels = ['dry-waste', 'e-waste', 'reusable', 'hazardous']
      
      // Find the highest probability
      const maxProbIndex = probabilities.indexOf(Math.max(...probabilities))
      const confidence = probabilities[maxProbIndex]
      const category = labels[maxProbIndex] || 'unknown'

      // Generate suggestions based on classification
      const suggestions = generateSuggestions(category, confidence)

      return {
        category,
        confidence,
        suggestions,
      }
    } catch (err) {
      console.error("Classification error:", err)
      throw new Error("Failed to classify waste")
    }
  }

  const generateSuggestions = (category: string, confidence: number): string[] => {
    const suggestions = []
    
    if (confidence < 0.6) {
      suggestions.push("The AI is not very confident about this classification.")
      suggestions.push("Please double-check the category manually.")
    }

    switch (category) {
      case 'e-waste':
        suggestions.push("Electronic waste should be disposed of at certified e-waste centers.")
        suggestions.push("Remove batteries before disposal if possible.")
        break
      case 'hazardous':
        suggestions.push("Hazardous waste requires special handling.")
        suggestions.push("Contact local waste management for proper disposal.")
        break
      case 'reusable':
        suggestions.push("Consider donating or selling these items.")
        suggestions.push("Check if local charities accept these items.")
        break
      case 'dry-waste':
        suggestions.push("Dry waste can often be recycled.")
        suggestions.push("Clean items before recycling if possible.")
        break
    }

    return suggestions
  }

  return {
    model,
    isLoading,
    error,
    classifyWaste,
  }
}
