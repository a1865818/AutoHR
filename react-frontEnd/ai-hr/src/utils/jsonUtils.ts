/**
 * Utility function to clean JSON objects from any ValueKind or other metadata properties
 * This is particularly useful for handling System.Text.Json JsonElement remnants
 */
export function cleanJsonObject(obj: any): any {
  // Handle null/undefined
  if (obj === null || obj === undefined) return obj;
  
  // Save reference to original questions for restoration later
  const originalQuestions = obj.questions && Array.isArray(obj.questions) ? [...obj.questions] : [];
  
  if (originalQuestions.length > 0) {
    console.log(`Found ${originalQuestions.length} questions in the original object for preservation`);
  }
  
  // First, create a clean copy without any reference to the original
  // This helps eliminate any ValueKind properties from JSON serialization
  const cleanObj = JSON.parse(JSON.stringify(obj));
  
  // Track original arrays to ensure they don't get lost
  const trackArrayProperties = (originalObj: any): { path: string; value: any[] }[] => {
    const result: { path: string; value: any[] }[] = [];
    
    function traverse(o: any, path: string = '') {
      if (Array.isArray(o)) {
        result.push({ path, value: o });
      }
      
      if (o && typeof o === 'object') {
        Object.keys(o).forEach(key => {
          const value = o[key];
          const newPath = path ? `${path}.${key}` : key;
          
          if (Array.isArray(value)) {
            result.push({ path: newPath, value });
          }
          
          if (value && typeof value === 'object') {
            traverse(value, newPath);
          }
        });
      }
    }
    
    traverse(originalObj);
    return result;
  };
  
  // Get original arrays
  const originalArrays = trackArrayProperties(obj);
  
  // Debug output to see what arrays are tracked
  console.log("Tracked array properties:", originalArrays);
  
  // Function to remove ValueKind and other metadata properties
  function removeValueKind(object: any) {
    if (!object || typeof object !== 'object') return;
    
    // Delete ValueKind property if it exists
    if ('ValueKind' in object) {
      delete object.ValueKind;
    }
    
    // Process all properties recursively
    Object.entries(object).forEach(([key, value]) => {
      if (value && typeof value === 'object') {
        removeValueKind(value);
      }
    });
  }
  
  // Clean the object
  removeValueKind(cleanObj);
  
  // Function to restore array properties by path
  function getNestedProperty(obj: any, path: string) {
    if (!path) return obj;
    return path.split('.').reduce((prev, curr) => {
      return prev && prev[curr] !== undefined ? prev[curr] : undefined;
    }, obj);
  }
  
  function setNestedProperty(obj: any, path: string, value: any) {
    if (!path) return;
    
    const parts = path.split('.');
    const lastKey = parts.pop();
    
    if (!lastKey) return;
    
    const target = parts.reduce((prev, curr) => {
      if (!prev[curr]) prev[curr] = {};
      return prev[curr];
    }, obj);
    
    // Always set the array value to ensure it's preserved
    if (target && lastKey) {
      target[lastKey] = Array.isArray(value) ? [...value] : value;
    }
  }
  
  // Ensure arrays are preserved
  originalArrays.forEach(({ path, value }) => {
    if (Array.isArray(value)) {
      setNestedProperty(cleanObj, path, value);
      
      // Special handling for questions array - make sure it's preserved
      if (path === 'questions' || path.endsWith('.questions')) {
        console.log(`Preserving array at ${path} with ${value.length} items`);
      }
    }
  });
  
  // Special check for questions array at top level - make sure it's always there
  if (originalQuestions.length > 0) {
    console.log("Ensuring questions array is preserved with", originalQuestions.length, "items");
    cleanObj.questions = [...originalQuestions];
  }
  
  // Special check for questions in configurationData - very important for round configuration
  if (cleanObj.configurationData && originalQuestions.length > 0) {
    console.log("Ensuring questions array is preserved in configurationData");
    if (!cleanObj.configurationData.questions || !cleanObj.configurationData.questions.length) {
      cleanObj.configurationData.questions = [...originalQuestions];
    }
  }
  
  return cleanObj;
} 