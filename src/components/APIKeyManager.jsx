import React, { useState, useEffect } from 'react';
import { supabase } from '../api/supabase';
import Button from './Button';
import { PlusIcon, TrashIcon, KeyIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

const APIKeyManager = () => {
  const [apiKeys, setApiKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newKey, setNewKey] = useState('');
  const [bulkKeys, setBulkKeys] = useState('');
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    fetchAPIKeys();
  }, []);

  const fetchAPIKeys = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('gemini_api_keys')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setApiKeys(data || []);
    } catch (err) {
      console.error('Error fetching API keys:', err);
      setError('Failed to load API keys');
    } finally {
      setLoading(false);
    }
  };

  const addSingleKey = async () => {
    if (!newKey.trim() || !newKey.startsWith('AIza')) {
      setError('Please enter a valid Gemini API key (starts with "AIza")');
      return;
    }

    setAdding(true);
    setError(null);
    try {
      const { error } = await supabase
        .from('gemini_api_keys')
        .insert([{ api_key: newKey.trim() }]);

      if (error) {
        if (error.code === '23505') {
          setError('This API key already exists');
        } else {
          throw error;
        }
      } else {
        setSuccess('API key added successfully');
        setNewKey('');
        await fetchAPIKeys();
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      console.error('Error adding API key:', err);
      setError('Failed to add API key');
    } finally {
      setAdding(false);
    }
  };

  const addBulkKeys = async () => {
    if (!bulkKeys.trim()) {
      setError('Please paste API keys');
      return;
    }

    const keys = bulkKeys
      .split('\n')
      .map(k => k.trim())
      .filter(k => k.startsWith('AIza'));

    if (keys.length === 0) {
      setError('No valid API keys found (must start with "AIza")');
      return;
    }

    setAdding(true);
    setError(null);
    try {
      const keysToInsert = keys.map(key => ({ api_key: key }));
      const { error } = await supabase
        .from('gemini_api_keys')
        .insert(keysToInsert);

      if (error) {
        if (error.code === '23505') {
          setError('Some keys already exist. Only new keys were added.');
        } else {
          throw error;
        }
      }

      setSuccess(`Successfully added ${keys.length} API key(s)`);
      setBulkKeys('');
      await fetchAPIKeys();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error adding bulk keys:', err);
      setError('Failed to add API keys');
    } finally {
      setAdding(false);
    }
  };

  const toggleKeyStatus = async (id, currentStatus) => {
    try {
      const { error } = await supabase
        .from('gemini_api_keys')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      await fetchAPIKeys();
      setSuccess('Key status updated');
      setTimeout(() => setSuccess(null), 2000);
    } catch (err) {
      console.error('Error updating key:', err);
      setError('Failed to update key status');
    }
  };

  const deleteKey = async (id) => {
    if (!confirm('Are you sure you want to delete this API key?')) return;

    try {
      const { error } = await supabase
        .from('gemini_api_keys')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchAPIKeys();
      setSuccess('Key deleted successfully');
      setTimeout(() => setSuccess(null), 2000);
    } catch (err) {
      console.error('Error deleting key:', err);
      setError('Failed to delete key');
    }
  };

  const activeKeys = apiKeys.filter(k => k.is_active).length;
  const inactiveKeys = apiKeys.filter(k => !k.is_active).length;

  return (
    <div className="container mx-auto p-4 max-w-6xl mt-8">
      <div className="mb-8 animate-fade-in-up">
        <div className="flex items-center gap-3 mb-2">
          <KeyIcon className="h-8 w-8 text-primary" />
          <h2 className="text-3xl md:text-4xl font-bold text-text">Gemini API Keys (Smart Round Robin)</h2>
        </div>
        <p className="text-textSecondary">
          Add up to 100 Gemini API keys. The system will rotate them automatically and handle errors with 10-second delays.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 animate-fade-in-up delay-200">
        <div className="bg-surface p-4 rounded-xl border-2 border-primary/30">
          <div className="text-3xl font-bold text-text">{apiKeys.length}</div>
          <div className="text-sm text-textSecondary">Total Keys</div>
        </div>
        <div className="bg-surface p-4 rounded-xl border-2 border-success/30">
          <div className="text-3xl font-bold text-success">{activeKeys}</div>
          <div className="text-sm text-textSecondary">Active Keys</div>
        </div>
        <div className="bg-surface p-4 rounded-xl border-2 border-textSecondary/30">
          <div className="text-3xl font-bold text-textSecondary">{inactiveKeys}</div>
          <div className="text-sm text-textSecondary">Inactive Keys</div>
        </div>
      </div>

      {(error || success) && (
        <div className={`border rounded-xl p-4 mb-6 animate-fade-in-up ${
          error ? 'bg-error/10 border-error/20 text-error' : 'bg-success/10 border-success/20 text-success'
        }`}>
          <p className="text-center">{error || success}</p>
        </div>
      )}

      <div className="bg-surface p-6 rounded-xl mb-8 animate-fade-in-up delay-300">
        <h3 className="text-xl font-semibold text-text mb-4">Add Single API Key</h3>
        <div className="flex gap-3">
          <input
            type="text"
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
            placeholder="AIzaSy..."
            className="flex-1 px-4 py-3 rounded-lg bg-background border-2 border-border focus:border-primary focus:outline-none text-text"
            disabled={adding}
          />
          <Button
            onClick={addSingleKey}
            disabled={adding || !newKey.trim()}
            className="px-6 py-3"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Add Key
          </Button>
        </div>
      </div>

      <div className="bg-surface p-6 rounded-xl mb-8 animate-fade-in-up delay-400">
        <h3 className="text-xl font-semibold text-text mb-2">Bulk Paste API Keys (One-Click Import)</h3>
        <p className="text-sm text-textSecondary mb-4">
          Paste all your API keys here (each starting with AIzaSy). The system will automatically extract and separate them.
        </p>
        <textarea
          value={bulkKeys}
          onChange={(e) => setBulkKeys(e.target.value)}
          placeholder="Paste all keys at once - they'll be automatically separated by detecting 'AIzaSy' pattern"
          className="w-full h-32 px-4 py-3 rounded-lg bg-background border-2 border-border focus:border-primary focus:outline-none text-text resize-none"
          disabled={adding}
        />
        <div className="flex justify-end mt-4">
          <Button
            onClick={addBulkKeys}
            disabled={adding || !bulkKeys.trim()}
            className="px-6 py-3"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Import All Keys
          </Button>
        </div>
      </div>

      <div className="bg-surface p-6 rounded-xl animate-fade-in-up delay-500">
        <h3 className="text-xl font-semibold text-text mb-4">Manage API Keys</h3>
        {loading ? (
          <div className="text-center text-textSecondary py-8">Loading API keys...</div>
        ) : apiKeys.length === 0 ? (
          <div className="text-center text-textSecondary py-8">
            No API keys found. Add your first key above.
          </div>
        ) : (
          <div className="space-y-3">
            {apiKeys.map((key) => (
              <div
                key={key.id}
                className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all ${
                  key.is_active
                    ? 'bg-background border-success/30'
                    : 'bg-background/50 border-border opacity-60'
                }`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    {key.is_active ? (
                      <CheckCircleIcon className="h-5 w-5 text-success" />
                    ) : (
                      <XCircleIcon className="h-5 w-5 text-textSecondary" />
                    )}
                    <code className="text-text font-mono text-sm">
                      {key.api_key.substring(0, 20)}...{key.api_key.substring(key.api_key.length - 4)}
                    </code>
                  </div>
                  <div className="flex gap-4 mt-2 text-xs text-textSecondary ml-8">
                    <span>Errors: {key.error_count}</span>
                    {key.last_used_at && (
                      <span>Last used: {new Date(key.last_used_at).toLocaleString()}</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => toggleKeyStatus(key.id, key.is_active)}
                    className={`px-4 py-2 text-sm ${
                      key.is_active
                        ? 'bg-warning hover:bg-warning/80'
                        : 'bg-success hover:bg-success/80'
                    }`}
                  >
                    {key.is_active ? 'Deactivate' : 'Activate'}
                  </Button>
                  <Button
                    onClick={() => deleteKey(key.id)}
                    className="px-4 py-2 text-sm bg-error hover:bg-error/80"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default APIKeyManager;
