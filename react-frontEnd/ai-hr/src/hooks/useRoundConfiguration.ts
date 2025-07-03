import { useState, useEffect, useCallback } from 'react';
import { RoundConfigurationAPI, RoundConfiguration } from '@/services/roundConfigurationApi';
import { cleanJsonObject } from '@/utils/jsonUtils';

// Initialize the API
const configApi = new RoundConfigurationAPI();

export function useRoundConfiguration(jobId: string, roundId: string) {
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');

  const fetchConfiguration = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      console.log(`Fetching configuration for job ${jobId}, round ${roundId}`);
      
      const response = await configApi.getConfiguration(jobId, roundId);
      
      if (response.success) {
        console.log("Configuration fetched successfully:", response.data);
        // Ensure we have all the expected properties
        if (!response.data) {
          console.warn("Received empty configuration data");
          setConfig(null);
        } else {
          // Clean the response data
          const cleanedConfig = cleanJsonObject(response.data);
          
          // Ensure configuration data has required properties
          if (cleanedConfig.configurationData) {
            // Log before making any changes
            console.log("Configuration data before ensuring properties:", cleanedConfig.configurationData);
            
            // Make sure questions property exists
            if (!cleanedConfig.configurationData.questions) {
              console.warn("No questions found in configuration data, adding empty array");
              cleanedConfig.configurationData.questions = [];
            }
            
            console.log("Final configuration data:", cleanedConfig.configurationData);
          }
          
          setConfig(cleanedConfig);
        }
      } else {
        console.error("Failed to load configuration:", response);
        setError("Failed to load configuration");
      }
    } catch (err: any) {
      const errorMsg = err.message || "Error loading configuration";
      console.error("Error fetching round configuration:", err);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [jobId, roundId]);

  const saveConfiguration = useCallback(async (configData: Partial<RoundConfiguration> & { configurationData?: any }) => {
    try {
      setSaveStatus('saving');
      console.log("Original configuration data to save:", configData);
      
      // Ensure the configuration data is properly structured
      let dataToSave = { ...configData };

      // Store original questions separately before cleaning to ensure they're not lost
      const originalQuestions = dataToSave.configurationData?.questions || [];
      
      console.log("Original questions before cleaning:", originalQuestions);
      
      // Deep clean the configuration data to ensure we're not sending any ValueKind properties
      if (dataToSave.configurationData) {
        // Use our utility function to clean the object
        dataToSave.configurationData = cleanJsonObject(dataToSave.configurationData);
        console.log("Cleaned configuration data:", dataToSave.configurationData);
        
        // Make sure questions are present in the configurationData
        if (!dataToSave.configurationData.questions || !dataToSave.configurationData.questions.length) {
          console.warn("Questions missing or empty after cleaning, restoring from original");
          dataToSave.configurationData.questions = [...originalQuestions];
        }
        
        // Log the questions after ensuring they exist
        console.log("Questions after ensuring they exist:", dataToSave.configurationData.questions);
      }
      
      // Make sure we have the required fields
      if (!dataToSave.name) {
        console.warn("Missing name in configuration, using default");
        dataToSave.name = "Round Configuration";
      }
      
      if (!dataToSave.duration) {
        console.warn("Missing duration in configuration, using default");
        dataToSave.duration = 30;
      }
      
      // Ensure configurationData is properly structured if it exists
      if (dataToSave.configurationData) {
        console.log("Final configuration data to save:", dataToSave.configurationData);
        // Make sure configurationData is not empty
        if (Object.keys(dataToSave.configurationData).length === 0) {
          console.warn("Empty configurationData object detected, adding default properties");
          // Add some default properties to ensure it's not empty
          dataToSave.configurationData = { initialized: true, questions: originalQuestions };
        }
      } else {
        console.warn("No configurationData found in the payload, creating default");
        // Create a default configurationData to avoid null/undefined
        dataToSave.configurationData = { initialized: true, questions: originalQuestions };
      }
      
      console.log("Final data to save:", dataToSave);
      const response = await configApi.saveConfiguration(jobId, roundId, dataToSave);
      
      if (response.success) {
        console.log("Configuration saved successfully:", response.data);
        // Clean the response data
        const cleanedResponse = cleanJsonObject(response.data);
        setConfig(cleanedResponse);
        setSaveStatus('success');
        return true;
      } else {
        console.error("Failed to save configuration:", response);
        setSaveStatus('error');
        setError('Failed to save configuration');
        return false;
      }
    } catch (err: any) {
      const errorMsg = err.message || "Error saving configuration";
      console.error("Failed to save configuration:", err);
      setSaveStatus('error');
      setError(errorMsg);
      return false;
    }
  }, [jobId, roundId]);
  
  const saveQuestions = useCallback(async (questions: any[]) => {
    try {
      setSaveStatus('saving');
      console.log("Saving questions:", questions);
      
      // Clean questions before saving
      const cleanedQuestions = cleanJsonObject(questions);
      
      const response = await configApi.saveQuestions(jobId, roundId, cleanedQuestions);
      
      if (response.success) {
        console.log("Questions saved successfully:", response.data);
        // Update the local config with new questions - ensure they're clean
        setConfig((prev: any) => ({
          ...prev,
          questions: cleanJsonObject(response.data)
        }));
        setSaveStatus('success');
        return true;
      } else {
        console.error("Failed to save questions:", response);
        setSaveStatus('error');
        return false;
      }
    } catch (err) {
      console.error("Failed to save questions:", err);
      setSaveStatus('error');
      return false;
    }
  }, [jobId, roundId]);

  useEffect(() => {
    fetchConfiguration();
  }, [fetchConfiguration]);

  return { 
    config, 
    loading, 
    error, 
    saveStatus,
    fetchConfiguration, 
    saveConfiguration,
    saveQuestions
  };
} 