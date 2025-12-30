/**
 * LocalStorage utility for managing speed test history
 */

const STORAGE_KEY = 'speedyzoom_test_history';
const MAX_STORED_TESTS = 1000; // Limit to prevent localStorage overflow
const STORAGE_VERSION = 1;

/**
 * Get all stored test results
 * @returns {Array} Array of test results
 */
export const getStoredResults = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    
    const data = JSON.parse(stored);
    
    // Handle version migration if needed
    if (data.version !== STORAGE_VERSION) {
      // Future: handle migrations here
      return data.results || [];
    }
    
    return data.results || [];
  } catch (error) {
    console.error('Error reading from localStorage:', error);
    return [];
  }
};

/**
 * Save a test result to localStorage
 * @param {Object} testResult - The test result to save
 */
export const saveTestResult = (testResult) => {
  try {
    const results = getStoredResults();
    
    // Add metadata if not present
    const enrichedResult = {
      ...testResult,
      savedAt: new Date().toISOString(),
      id: testResult.id || Date.now().toString()
    };
    
    // Add to beginning of array (most recent first)
    results.unshift(enrichedResult);
    
    // Limit storage size
    const limitedResults = results.slice(0, MAX_STORED_TESTS);
    
    // Save to localStorage
    const dataToStore = {
      version: STORAGE_VERSION,
      lastUpdated: new Date().toISOString(),
      results: limitedResults
    };
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToStore));
    
    return true;
  } catch (error) {
    console.error('Error saving to localStorage:', error);
    
    // If quota exceeded, try to remove oldest entries
    if (error.name === 'QuotaExceededError') {
      try {
        const results = getStoredResults();
        // Keep only the most recent 500 entries
        const reducedResults = results.slice(0, 500);
        const dataToStore = {
          version: STORAGE_VERSION,
          lastUpdated: new Date().toISOString(),
          results: reducedResults
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToStore));
        console.warn('Storage quota exceeded. Reduced to 500 entries.');
      } catch (retryError) {
        console.error('Failed to reduce storage size:', retryError);
      }
    }
    
    return false;
  }
};

/**
 * Save multiple test results at once
 * @param {Array} testResults - Array of test results to save
 */
export const saveMultipleResults = (testResults) => {
  testResults.forEach(result => saveTestResult(result));
};

/**
 * Clear all stored test results
 */
export const clearStoredResults = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch (error) {
    console.error('Error clearing localStorage:', error);
    return false;
  }
};

/**
 * Delete a specific test result by ID
 * @param {string} testId - ID of the test to delete
 */
export const deleteTestResult = (testId) => {
  try {
    const results = getStoredResults();
    const filtered = results.filter(r => r.id !== testId);
    
    const dataToStore = {
      version: STORAGE_VERSION,
      lastUpdated: new Date().toISOString(),
      results: filtered
    };
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToStore));
    return true;
  } catch (error) {
    console.error('Error deleting test result:', error);
    return false;
  }
};

/**
 * Get storage statistics
 * @returns {Object} Storage stats
 */
export const getStorageStats = () => {
  try {
    const results = getStoredResults();
    const stored = localStorage.getItem(STORAGE_KEY);
    const sizeInBytes = new Blob([stored || '']).size;
    const sizeInKB = (sizeInBytes / 1024).toFixed(2);
    
    return {
      totalTests: results.length,
      storageSize: sizeInKB,
      oldestTest: results.length > 0 ? results[results.length - 1]?.timestamp : null,
      newestTest: results.length > 0 ? results[0]?.timestamp : null
    };
  } catch (error) {
    console.error('Error getting storage stats:', error);
    return {
      totalTests: 0,
      storageSize: 0,
      oldestTest: null,
      newestTest: null
    };
  }
};

/**
 * Export all results as JSON
 * @returns {string} JSON string of all results
 */
export const exportResultsAsJSON = () => {
  const results = getStoredResults();
  return JSON.stringify(results, null, 2);
};

/**
 * Export all results as CSV
 * @returns {string} CSV string of all results
 */
export const exportResultsAsCSV = () => {
  const results = getStoredResults();
  
  if (results.length === 0) return '';
  
  // CSV Header
  const headers = [
    'Timestamp',
    'Type',
    'Speed (Mbps)',
    'Server Region',
    'Server Name',
    'Latency (ms)',
    'Jitter (ms)',
    'Duration (s)',
    'IP Address',
    'ISP',
    'Location'
  ];
  
  // CSV Rows
  const rows = results.map(result => {
    return [
      result.timestamp || '',
      result.type || '',
      result.speed || 0,
      result.server?.region || '',
      result.server?.name || '',
      result.metrics?.latency || 0,
      result.metrics?.jitter || 0,
      result.duration ? (result.duration / 1000).toFixed(2) : 0,
      result.userInfo?.ip || '',
      result.userInfo?.isp || '',
      result.userInfo?.location || ''
    ].map(field => `"${String(field).replace(/"/g, '""')}"`).join(',');
  });
  
  return [headers.map(h => `"${h}"`).join(','), ...rows].join('\n');
};

/**
 * Filter results by date range
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Array} Filtered results
 */
export const filterResultsByDateRange = (startDate, endDate) => {
  const results = getStoredResults();
  return results.filter(result => {
    const testDate = new Date(result.timestamp);
    return testDate >= startDate && testDate <= endDate;
  });
};

/**
 * Filter results by test type
 * @param {string} type - 'download' or 'upload'
 * @returns {Array} Filtered results
 */
export const filterResultsByType = (type) => {
  const results = getStoredResults();
  return results.filter(result => result.type === type);
};

/**
 * Filter results by server
 * @param {string} serverId - Server ID
 * @returns {Array} Filtered results
 */
export const filterResultsByServer = (serverId) => {
  const results = getStoredResults();
  return results.filter(result => result.server?.id === serverId);
};

