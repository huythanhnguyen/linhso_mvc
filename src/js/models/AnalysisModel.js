/**
 * Analysis Model
 */
class AnalysisModel {
    constructor(data = {}) {
        this.id = data.id || null;
        this.phoneNumber = data.phoneNumber || '';
        this.createdAt = data.createdAt || new Date().toISOString();
        
        // Main analysis data
        this.result = data.result || {};
        this.balance = data.balance || data.result?.balance || null;
        this.energyLevel = data.energyLevel || data.result?.energyLevel || {
            total: 0,
            cat: 0,
            hung: 0,
            ratio: 0
        };
        
        // Star information
        this.starSequence = data.starSequence || data.result?.starSequence || [];
        this.starCombinations = data.starCombinations || data.result?.starCombinations || [];
        this.keyCombinations = data.keyCombinations || data.result?.keyCombinations || [];
        this.dangerousCombinations = data.dangerousCombinations || data.result?.dangerousCombinations || [];
        this.keyPositions = data.keyPositions || data.result?.keyPositions;
        this.last3DigitsAnalysis = data.last3DigitsAnalysis || data.result?.last3DigitsAnalysis;
        this.specialAttribute = data.specialAttribute || data.result?.specialAttribute;
        
        // Additional response data
        this.geminiResponse = data.geminiResponse || '';
    }
    
    /**
     * Get most powerful stars (highest energy)
     * @param {number} count - Number of stars to return
     * @returns {Array} Top stars
     */
    getTopStars(count = 3) {
        if (!this.starSequence || !this.starSequence.length) {
            return [];
        }
        
        return [...this.starSequence]
            .sort((a, b) => b.energyLevel - a.energyLevel)
            .slice(0, count);
    }
    
    /**
     * Normalize data to ensure consistent structure
     * This is useful when dealing with inconsistent API responses
     */
    normalize() {
        // If properties are in result object but not in root, copy them up
        if (this.result) {
            if (!this.balance && this.result.balance) this.balance = this.result.balance;
            if (!this.energyLevel && this.result.energyLevel) this.energyLevel = this.result.energyLevel;
            if (!this.starSequence.length && this.result.starSequence) this.starSequence = this.result.starSequence;
            if (!this.starCombinations.length && this.result.starCombinations) this.starCombinations = this.result.starCombinations;
            if (!this.keyCombinations.length && this.result.keyCombinations) this.keyCombinations = this.result.keyCombinations;
            if (!this.dangerousCombinations.length && this.result.dangerousCombinations) this.dangerousCombinations = this.result.dangerousCombinations;
            if (!this.keyPositions && this.result.keyPositions) this.keyPositions = this.result.keyPositions;
            if (!this.last3DigitsAnalysis && this.result.last3DigitsAnalysis) this.last3DigitsAnalysis = this.result.last3DigitsAnalysis;
            if (!this.specialAttribute && this.result.specialAttribute) this.specialAttribute = this.result.specialAttribute;
        }
        
        return this;
    }
    
    /**
     * Convert to plain object
     * @returns {Object} Plain object
     */
    toJSON() {
        return {
            id: this.id,
            phoneNumber: this.phoneNumber,
            createdAt: this.createdAt,
            balance: this.balance,
            energyLevel: this.energyLevel,
            starSequence: this.starSequence,
            starCombinations: this.starCombinations,
            keyCombinations: this.keyCombinations,
            dangerousCombinations: this.dangerousCombinations,
            keyPositions: this.keyPositions,
            last3DigitsAnalysis: this.last3DigitsAnalysis,
            specialAttribute: this.specialAttribute,
            geminiResponse: this.geminiResponse
        };
    }
}

export default AnalysisModel;