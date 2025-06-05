import { useState, useEffect, useCallback } from 'react';
import llmService from '../services/llmService';

// Custom hook for LLM service integration
export function useLLM() {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [error, setError] = useState(null);

  // Initialize connection and event listeners
  useEffect(() => {
    const handleConnected = () => {
      setIsConnected(true);
      setConnectionStatus('connected');
      setError(null);
    };

    const handleDisconnected = () => {
      setIsConnected(false);
      setConnectionStatus('disconnected');
    };

    const handleError = (error) => {
      setError(error.message || 'Connection error');
      setConnectionStatus('error');
    };

    const handleStatus = (message) => {
      console.log('LLM Status:', message);
    };

    // Add event listeners
    llmService.on('connected', handleConnected);
    llmService.on('disconnected', handleDisconnected);
    llmService.on('error', handleError);
    llmService.on('status', handleStatus);

    // Attempt to connect
    const connect = async () => {
      try {
        setConnectionStatus('connecting');
        await llmService.connect();
      } catch (error) {
        console.error('Failed to connect to LLM service:', error);
        setError(error.message || 'Failed to connect');
        setConnectionStatus('error');
      }
    };

    connect();

    // Cleanup on unmount
    return () => {
      llmService.off('connected', handleConnected);
      llmService.off('disconnected', handleDisconnected);
      llmService.off('error', handleError);
      llmService.off('status', handleStatus);
    };
  }, []);

  // Reconnect function
  const reconnect = useCallback(async () => {
    try {
      setConnectionStatus('connecting');
      setError(null);
      await llmService.connect();
    } catch (error) {
      console.error('Reconnection failed:', error);
      setError(error.message || 'Reconnection failed');
      setConnectionStatus('error');
    }
  }, []);

  // Disconnect function
  const disconnect = useCallback(() => {
    llmService.disconnect();
    setIsConnected(false);
    setConnectionStatus('disconnected');
  }, []);

  return {
    isConnected,
    connectionStatus,
    error,
    reconnect,
    disconnect,
    service: llmService
  };
}

// Hook for email summarization
export function useEmailSummarization() {
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState(null);

  const summarizeEmail = useCallback(async (emailContent, model = null) => {
    setSummaryLoading(true);
    setSummaryError(null);

    try {
      const result = await llmService.summarizeEmail(emailContent, model);
      return result.summary;
    } catch (error) {
      console.error('Email summarization failed:', error);
      setSummaryError(error.message || 'Failed to generate summary');
      throw error;
    } finally {
      setSummaryLoading(false);
    }
  }, []);

  return {
    summarizeEmail,
    summaryLoading,
    summaryError
  };
}

// Hook for reply generation
export function useReplyGeneration() {
  const [replyLoading, setReplyLoading] = useState(false);
  const [replyError, setReplyError] = useState(null);

  const generateReply = useCallback(async (emailContext, instructions, model = null) => {
    setReplyLoading(true);
    setReplyError(null);

    try {
      const result = await llmService.generateReplyDraft(emailContext, instructions, model);
      return result.draft;
    } catch (error) {
      console.error('Reply generation failed:', error);
      setReplyError(error.message || 'Failed to generate reply');
      throw error;
    } finally {
      setReplyLoading(false);
    }
  }, []);

  return {
    generateReply,
    replyLoading,
    replyError
  };
}

// Combined hook with all LLM functionality
export function useLLMFeatures() {
  const llm = useLLM();
  const summarization = useEmailSummarization();
  const replyGeneration = useReplyGeneration();

  return {
    ...llm,
    ...summarization,
    ...replyGeneration
  };
}