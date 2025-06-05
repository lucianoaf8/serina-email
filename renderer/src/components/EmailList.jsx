import React, { useState, useEffect } from 'react';
import EmailItem from './EmailItem';

function EmailList({ onEmailSelect, selectedEmailId }) {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    unreadOnly: false,
    folder: null,
    searchQuery: ''
  });
  const [pagination, setPagination] = useState({
    limit: 50,
    offset: 0,
    hasMore: true
  });

  // Fetch emails from backend
  const fetchEmails = async (reset = false) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        limit: pagination.limit,
        offset: reset ? 0 : pagination.offset
      });

      if (filters.unreadOnly) {
        params.append('unread_only', 'true');
      }
      if (filters.folder) {
        params.append('folder', filters.folder);
      }

      let url = 'http://localhost:8000/emails';
      
      // Use search endpoint if there's a search query
      if (filters.searchQuery.trim()) {
        url = 'http://localhost:8000/emails/search';
        params.set('q', filters.searchQuery.trim());
        params.delete('offset'); // Search doesn't use offset
      }

      const response = await fetch(`${url}?${params}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch emails: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (reset) {
        setEmails(data);
        setPagination(prev => ({ ...prev, offset: data.length, hasMore: data.length === pagination.limit }));
      } else {
        setEmails(prev => [...prev, ...data]);
        setPagination(prev => ({ 
          ...prev, 
          offset: prev.offset + data.length,
          hasMore: data.length === pagination.limit 
        }));
      }

    } catch (err) {
      console.error('Error fetching emails:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchEmails(true);
  }, [filters.unreadOnly, filters.folder, filters.searchQuery]);

  // Load more emails
  const loadMore = () => {
    if (!loading && pagination.hasMore) {
      fetchEmails(false);
    }
  };

  // Handle search
  const handleSearch = (query) => {
    setFilters(prev => ({ ...prev, searchQuery: query }));
    setPagination(prev => ({ ...prev, offset: 0 }));
  };

  // Handle filter changes
  const toggleUnreadFilter = () => {
    setFilters(prev => ({ ...prev, unreadOnly: !prev.unreadOnly }));
    setPagination(prev => ({ ...prev, offset: 0 }));
  };

  // Handle email status updates
  const updateEmailStatus = async (emailId, statusUpdate) => {
    try {
      const response = await fetch(`http://localhost:8000/emails/${emailId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(statusUpdate)
      });

      if (!response.ok) {
        throw new Error('Failed to update email status');
      }

      // Update local state
      setEmails(prev => prev.map(email => 
        email.id === emailId 
          ? { ...email, ...statusUpdate }
          : email
      ));

    } catch (err) {
      console.error('Error updating email status:', err);
      setError(err.message);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      {/* Header with filters and search */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-col space-y-3">
          {/* Search bar */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search emails..."
              value={filters.searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full px-4 py-2 pl-10 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-white"
            />
            <svg
              className="absolute left-3 top-2.5 h-4 w-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Filter buttons */}
          <div className="flex space-x-2">
            <button
              onClick={toggleUnreadFilter}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                filters.unreadOnly
                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
              }`}
            >
              {filters.unreadOnly ? 'Show All' : 'Unread Only'}
            </button>
            
            <button
              onClick={() => fetchEmails(true)}
              disabled={loading}
              className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>
      </div>

      {/* Email list */}
      <div className="flex-1 overflow-auto">
        {error && (
          <div className="p-4 text-red-600 bg-red-50 border-b border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800">
            {error}
          </div>
        )}

        {emails.length === 0 && !loading ? (
          <div className="flex items-center justify-center h-32 text-gray-500 dark:text-gray-400">
            {filters.searchQuery ? 'No emails found matching your search.' : 'No emails to display.'}
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {emails.map((email) => (
              <EmailItem
                key={email.id}
                email={email}
                isSelected={email.id === selectedEmailId}
                onClick={() => onEmailSelect(email)}
                onStatusUpdate={updateEmailStatus}
              />
            ))}
          </div>
        )}

        {/* Load more button */}
        {pagination.hasMore && !filters.searchQuery && (
          <div className="p-4 text-center">
            <button
              onClick={loadMore}
              disabled={loading}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Load More'}
            </button>
          </div>
        )}

        {loading && emails.length === 0 && (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}
      </div>
    </div>
  );
}

export default EmailList;