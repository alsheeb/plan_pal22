import os
import json
import numpy as np
import tensorflow as tf
from keras.applications import ResNet50V2
from keras import layers, models
from PIL import Image
from backend.config import Config

class PlantDiseaseModel:
    """Load and run the trained plant disease model"""
    
    def __init__(self):
        self.model = None
        self.class_names = []
        self.img_size = Config.IMG_SIZE
        self.load_model()
    
    def load_model(self):
        """Load the trained model and metadata"""
        try:
            model_path = Config.MODEL_PATH
            
            # Load metadata (class names)
            metadata_path = os.path.join(model_path, 'metadata')
            if os.path.exists(metadata_path):
                with open(metadata_path, 'r') as f:
                    metadata = json.load(f)
                    self.class_names = metadata.get('class_names', [])
            
            # Load config
            config_path = os.path.join(model_path, 'config')
            if os.path.exists(config_path):
                with open(config_path, 'r') as f:
                    config = json.load(f)
                    # Override img_size if specified in config
                    if 'img_size' in config:
                        self.img_size = tuple(config['img_size'])
            
            # Build model architecture (same as training)
            num_classes = len(self.class_names) if self.class_names else 39
            
            base_model = ResNet50V2(
                weights="imagenet",
                include_top=False,
                input_shape=(self.img_size[0], self.img_size[1], 3)
            )
            base_model.trainable = False
            
            self.model = models.Sequential([
                base_model,
                layers.GlobalAveragePooling2D(),
                layers.Dense(num_classes, activation="softmax")
            ])
            
            # Load trained weights
            weights_path = os.path.join(model_path, 'model.weights.h5')
            if os.path.exists(weights_path):
                self.model.load_weights(weights_path)
                print("✅ Model weights loaded successfully")
            else:
                print("⚠️ Warning: Model weights file not found")
            
            print(f"✅ Model loaded with {num_classes} classes")
            
        except Exception as e:
            print(f"❌ Error loading model: {e}")
            self.model = None
    
    def preprocess_image(self, image_path):
        """Preprocess image for prediction"""
        try:
            # Load and resize image
            img = Image.open(image_path)
            img = img.convert('RGB')
            img = img.resize(self.img_size)
            
            # Convert to numpy array and normalize
            img_array = np.array(img, dtype=np.float32) / 255.0
            
            # Add batch dimension
            img_array = np.expand_dims(img_array, axis=0)
            
            return img_array
        except Exception as e:
            print(f"❌ Error preprocessing image: {e}")
            return None
    
    def predict(self, image_path):
        """Run prediction on an image"""
        if self.model is None:
            return {
                'success': False,
                'error': 'Model not loaded'
            }
        
        try:
            # Preprocess image
            img_array = self.preprocess_image(image_path)
            if img_array is None:
                return {
                    'success': False,
                    'error': 'Failed to preprocess image'
                }
            
            # Run prediction
            predictions = self.model.predict(img_array, verbose=0)
            
            # Get top 2 predictions
            top_indices = np.argsort(predictions[0])[::-1][:2]
            
            # Primary prediction
            primary_idx = top_indices[0]
            primary_confidence = float(predictions[0][primary_idx])
            primary_class = self.class_names[primary_idx] if primary_idx < len(self.class_names) else f"Class_{primary_idx}"
            
            # Secondary prediction
            secondary_idx = top_indices[1]
            secondary_confidence = float(predictions[0][secondary_idx])
            secondary_class = self.class_names[secondary_idx] if secondary_idx < len(self.class_names) else f"Class_{secondary_idx}"
            
            return {
                'success': True,
                'predicted_class': primary_class,
                'confidence': round(primary_confidence * 100, 2),
                'second_guess': secondary_class,
                'second_confidence': round(secondary_confidence * 100, 2)
            }
            
        except Exception as e:
            print(f"❌ Prediction error: {e}")
            return {
                'success': False,
                'error': str(e)
            }


# Global model instance
plant_model = PlantDiseaseModel()