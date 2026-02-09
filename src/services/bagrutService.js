/**
 * Bagrut API Service Layer
 * Handles all API operations for Bagrut management with updated grading structure
 * and new director evaluation and recital configuration features
 */

import { apiClient } from './apiService.js';

const BASE_URL = '/bagrut';

export const bagrutService = {
  /**
   * Get all bagrut records with optional filtering
   * @param {Object} params - Query parameters
   * @returns {Promise<Array>} Array of bagrut records
   */
  async getAllBagruts(params = {}) {
    try {
      console.log('🌐 BagrutService: Fetching bagruts with params:', params);
      const response = await apiClient.get(BASE_URL, params);
      
      console.log('📨 BagrutService: Raw API response:', response);
      console.log('📨 BagrutService: Response type:', typeof response);
      console.log('📨 BagrutService: Is array?', Array.isArray(response));
      
      // apiClient.get() returns the data directly
      // The response should be an array of bagruts
      let bagruts = [];
      if (Array.isArray(response)) {
        bagruts = response;
      } else if (response) {
        console.warn('Unexpected response format (expected array):', response);
        bagruts = [];
      }
      
      console.log('✅ BagrutService: Returning bagruts:', bagruts.length, 'items');
      return bagruts;
    } catch (error) {
      console.error('❌ BagrutService: Error fetching bagruts:', error);
      throw new Error('שגיאה בטעינת רשימת בגרויות');
    }
  },

  /**
   * Get bagrut by ID
   * @param {string} bagrutId - Bagrut ID
   * @returns {Promise<Object>} Bagrut record
   */
  async getBagrutById(bagrutId) {
    try {
      console.log('🔍 BagrutService: Fetching bagrut by ID:', bagrutId);
      const response = await apiClient.get(`${BASE_URL}/${bagrutId}`);
      console.log('📦 BagrutService: getBagrutById response:', response);
      
      // apiClient.get() returns the data directly, not wrapped in a response object
      // The response IS the bagrut data
      return response;
    } catch (error) {
      console.error('Error fetching bagrut:', error);
      throw new Error('שגיאה בטעינת בגרות');
    }
  },

  /**
   * Get bagrut by student ID
   * @param {string} studentId - Student ID
   * @returns {Promise<Object>} Bagrut record
   */
  async getBagrutByStudentId(studentId) {
    try {
      console.log('🔍 BagrutService: Fetching bagrut by student ID:', studentId);
      const response = await apiClient.get(`${BASE_URL}/student/${studentId}`);
      console.log('📦 BagrutService: getBagrutByStudentId response:', response);
      
      // apiClient.get() returns the data directly, not wrapped in a response object
      // The response IS the bagrut data
      return response;
    } catch (error) {
      console.error('Error fetching student bagrut:', error);
      throw new Error('שגיאה בטעינת בגרות התלמיד');
    }
  },

  /**
   * Create new bagrut record
   * @param {Object} bagrutData - Bagrut creation data
   * @returns {Promise<Object>} Created bagrut record
   */
  async createBagrut(bagrutData) {
    try {
      this.validateBagrutData(bagrutData);
      const response = await apiClient.post(BASE_URL, bagrutData);
      
      // Debug logging to understand response structure
      console.log('🎓 Create Bagrut Response:', response);
      
      // apiClient.post() returns the data directly
      // The response IS the created bagrut object
      if (response && response._id) {
        return response;
      } else {
        console.error('Unexpected response format:', response);
        throw new Error('תגובה לא צפויה מהשרת');
      }
    } catch (error) {
      console.error('Error creating bagrut:', error);
      throw error instanceof Error ? error : new Error('שגיאה ביצירת בגרות חדשה');
    }
  },

  /**
   * Update bagrut record
   * @param {string} bagrutId - Bagrut ID
   * @param {Object} updateData - Update data
   * @returns {Promise<Object>} Updated bagrut record
   */
  async updateBagrut(bagrutId, updateData) {
    try {
      this.validateUpdateData(updateData);
      const response = await apiClient.put(`${BASE_URL}/${bagrutId}`, updateData);
      // apiClient returns the data directly
      return response;
    } catch (error) {
      console.error('Error updating bagrut:', error);
      throw new Error('שגיאה בעדכון בגרות');
    }
  },

  /**
   * Update bagrut program array only - avoids issues with transformed presentations data
   * @param {string} bagrutId - Bagrut ID
   * @param {Array} program - Program pieces array
   * @returns {Promise<Object>} Updated bagrut record
   */
  async updateBagrutProgram(bagrutId, program) {
    try {
      const response = await apiClient.put(`${BASE_URL}/${bagrutId}/program`, { program });
      // apiClient returns the data directly
      return response;
    } catch (error) {
      console.error('Error updating bagrut program:', error);
      throw new Error('שגיאה בעדכון תכנית הבגרות');
    }
  },

  /**
   * Update presentation with corrected point structure
   * @param {string} bagrutId - Bagrut ID
   * @param {number} presentationIndex - Presentation index (0-3)
   * @param {Object} presentationData - Presentation data with detailed grading
   * @returns {Promise<Object>} Updated bagrut record
   */
  async updatePresentation(bagrutId, presentationIndex, presentationData) {
    try {
      this.validatePresentationData(presentationData);
      const response = await apiClient.put(
        `${BASE_URL}/${bagrutId}/presentation/${presentationIndex}`, 
        presentationData
      );
      // apiClient returns the data directly
      return response;
    } catch (error) {
      console.error('Error updating presentation:', error);
      throw new Error('שגיאה בעדכון המצגת');
    }
  },

  /**
   * Update director evaluation with points and comments
   * @param {string} bagrutId - Bagrut ID
   * @param {Object} evaluationData - Director evaluation data
   * @param {number} evaluationData.points - Points awarded by director
   * @param {string} evaluationData.comments - Director's comments
   * @returns {Promise<Object>} Updated bagrut record
   */
  async updateDirectorEvaluation(bagrutId, evaluationData) {
    try {
      this.validateDirectorEvaluation(evaluationData);
      const response = await apiClient.put(
        `${BASE_URL}/${bagrutId}/director-evaluation`,
        evaluationData
      );
      // apiClient returns the data directly
      return response;
    } catch (error) {
      console.error('Error updating director evaluation:', error);
      throw new Error('שגיאה בעדכון הערכת המנהל');
    }
  },

  /**
   * Set recital configuration with units and field
   * @param {string} bagrutId - Bagrut ID
   * @param {Object} configData - Recital configuration data
   * @param {number} configData.recitalUnits - Number of units (3 or 5)
   * @param {string} configData.recitalField - Field type ('קלאסי', 'ג\'אז', 'שירה')
   * @returns {Promise<Object>} Updated bagrut record
   */
  async setRecitalConfiguration(bagrutId, configData) {
    try {
      this.validateRecitalConfiguration(configData);
      const response = await apiClient.put(
        `${BASE_URL}/${bagrutId}/recital-config`,
        configData
      );
      // apiClient returns the data directly
      return response;
    } catch (error) {
      console.error('Error setting recital configuration:', error);
      throw new Error('שגיאה בהגדרת תצורת הרסיטל');
    }
  },

  /**
   * Calculate final grade including director evaluation component
   * @param {string} bagrutId - Bagrut ID
   * @returns {Promise<Object>} Updated bagrut record with calculated grade
   */
  async calculateFinalGrade(bagrutId) {
    try {
      const response = await apiClient.post(`${BASE_URL}/${bagrutId}/calculate-grade`);
      // apiClient returns the data directly
      return response;
    } catch (error) {
      console.error('Error calculating final grade:', error);
      throw new Error('שגיאה בחישוב הציון הסופי');
    }
  },

  /**
   * Delete bagrut record
   * @param {string} bagrutId - Bagrut ID
   * @returns {Promise<boolean>} True if deletion was successful
   */
  async deleteBagrut(bagrutId) {
    try {
      console.log('🗑️ BagrutService: Deleting bagrut:', bagrutId);
      await apiClient.delete(`${BASE_URL}/${bagrutId}`);
      console.log('✅ BagrutService: Bagrut deleted successfully');
      return true;
    } catch (error) {
      console.error('❌ BagrutService: Error deleting bagrut:', error);
      throw new Error('שגיאה במחיקת הבגרות');
    }
  },

  /**
   * Get default detailed grading structure with corrected point maximums
   * @returns {Object} Default detailed grading structure
   */
  getDefaultDetailedGrading() {
    return {
      playingSkills: {
        points: 0,
        maxPoints: 40,
        comments: ''
      },
      musicalUnderstanding: {
        points: 0,
        maxPoints: 30,
        comments: ''
      },
      textKnowledge: {
        points: 0,
        maxPoints: 20,
        comments: ''
      },
      playingByHeart: {
        points: 0,
        maxPoints: 10,
        comments: ''
      }
    };
  },

  /**
   * Validate bagrut data before creation/update
   * @param {Object} bagrutData - Bagrut data to validate
   */
  validateBagrutData(bagrutData) {
    if (!bagrutData.studentId) {
      throw new Error('מזהה תלמיד נדרש');
    }
    if (!bagrutData.teacherId) {
      throw new Error('מזהה מורה נדרש');
    }
    if (bagrutData.recitalUnits && ![3, 5].includes(bagrutData.recitalUnits)) {
      throw new Error('מספר יחידות חייב להיות 3 או 5');
    }
    if (bagrutData.recitalField && !['קלאסי', 'ג\'אז', 'שירה', 'מוסיקה ישראלית', 'מוסיקה עולמית'].includes(bagrutData.recitalField)) {
      throw new Error('תחום הרסיטל לא תקין');
    }
  },

  /**
   * Validate update data
   * @param {Object} updateData - Update data to validate
   */
  validateUpdateData(updateData) {
    if (updateData.recitalUnits && ![3, 5].includes(updateData.recitalUnits)) {
      throw new Error('מספר יחידות חייב להיות 3 או 5');
    }
    if (updateData.recitalField && !['קלאסי', 'ג\'אז', 'שירה', 'מוסיקה ישראלית', 'מוסיקה עולמית'].includes(updateData.recitalField)) {
      throw new Error('תחום הרסיטל לא תקין');
    }
  },

  /**
   * Validate presentation data with corrected point structure
   * @param {Object} presentationData - Presentation data to validate
   */
  validatePresentationData(presentationData) {
    if (presentationData.detailedGrading) {
      const grading = presentationData.detailedGrading;
      
      if (grading.playingSkills?.points > 40) {
        throw new Error('כישורי נגינה לא יכולים לעלות על 40 נקודות');
      }
      if (grading.musicalUnderstanding?.points > 30) {
        throw new Error('הבנה מוזיקלית לא יכולה לעלות על 30 נקודות');
      }
      if (grading.textKnowledge?.points > 20) {
        throw new Error('ידע בטקסט לא יכול לעלות על 20 נקודות');
      }
      if (grading.playingByHeart?.points > 10) {
        throw new Error('נגינה בעל פה לא יכולה לעלות על 10 נקודות');
      }

      const totalPoints = (grading.playingSkills?.points || 0) +
                         (grading.musicalUnderstanding?.points || 0) +
                         (grading.textKnowledge?.points || 0) +
                         (grading.playingByHeart?.points || 0);
      
      if (totalPoints > 100) {
        throw new Error('סך כל הנקודות לא יכול לעלות על 100');
      }
    }
  },

  /**
   * Validate director evaluation data
   * @param {Object} evaluationData - Director evaluation data to validate
   */
  validateDirectorEvaluation(evaluationData) {
    if (typeof evaluationData.points !== 'number') {
      throw new Error('נקודות המנהל חייבות להיות מספר');
    }
    if (evaluationData.points < 0 || evaluationData.points > 100) {
      throw new Error('נקודות המנהל חייבות להיות בין 0 ל-100');
    }
  },

  /**
   * Validate recital configuration data
   * @param {Object} configData - Recital configuration data to validate
   */
  validateRecitalConfiguration(configData) {
    if (![3, 5].includes(configData.recitalUnits)) {
      throw new Error('מספר יחידות חייב להיות 3 או 5');
    }
    if (!['קלאסי', 'ג\'אז', 'שירה'].includes(configData.recitalField)) {
      throw new Error('תחום הרסיטל חייב להיות קלאסי, ג\'אז או שירה');
    }
  }
};

export default bagrutService;