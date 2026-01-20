from flask import Blueprint, jsonify
from utils.db import db

disease_bp = Blueprint('disease', __name__)


@disease_bp.route('/diseases', methods=['GET'])
def get_all_diseases():
    """Get all diseases list"""
    try:
        diseases = db.get_all_diseases()
        
        return jsonify({
            'success': True,
            'count': len(diseases) if diseases else 0,
            'diseases': diseases if diseases else []
        }), 200
        
    except Exception as e:
        print(f"Get diseases error: {e}")
        return jsonify({
            'success': False,
            'message': 'Failed to fetch diseases'
        }), 500


@disease_bp.route('/disease/<int:disease_id>', methods=['GET'])
def get_disease_by_id(disease_id):
    """Get disease by ID"""
    try:
        disease = db.get_disease_by_id(disease_id)
        
        if disease:
            return jsonify({
                'success': True,
                'disease': disease
            }), 200
        else:
            return jsonify({
                'success': False,
                'message': 'Disease not found'
            }), 404
            
    except Exception as e:
        print(f"Get disease error: {e}")
        return jsonify({
            'success': False,
            'message': 'Failed to fetch disease'
        }), 500


@disease_bp.route('/disease/search/<name>', methods=['GET'])
def search_disease(name):
    """Search disease by name"""
    try:
        disease = db.get_disease_by_name(name)
        
        if disease:
            return jsonify({
                'success': True,
                'disease': disease
            }), 200
        else:
            return jsonify({
                'success': False,
                'message': f'Disease "{name}" not found'
            }), 404
            
    except Exception as e:
        print(f"Search disease error: {e}")
        return jsonify({
            'success': False,
            'message': 'Failed to search disease'
        }), 500