import React, { useState, useEffect } from 'react';

function App() {
  const [followersData, setFollowersData] = useState(null);
  const [followingData, setFollowingData] = useState(null);
  const [notFollowBack, setNotFollowBack] = useState([]);
  const [filteredNotFollowBack, setFilteredNotFollowBack] = useState([]);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState('instructions');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'username', direction: 'asc' });

  // Handle file reading
  const handleFile = (file, type) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target.result);
        if (type === 'followers') setFollowersData(json);
        else if (type === 'following') setFollowingData(json);
        setError('');
      } catch (err) {
        setError(`Failed to read ${type} file: ${err.message}`);
      }
    };
    reader.readAsText(file);
  };

  // Drag & Drop
  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    const files = Array.from(e.dataTransfer.files);
    files.forEach((file) => {
      if (file.name.includes('followers')) handleFile(file, 'followers');
      else if (file.name.includes('following')) handleFile(file, 'following');
    });
  };

  const handleDrag = (e) => {
    e.preventDefault();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleSelectFile = (e, type) => {
    const file = e.target.files[0];
    if (file) handleFile(file, type);
  };

  // Process data
  const process = () => {
    if (!followersData || !followingData) {
      setError('Please upload both files first.');
      return;
    }

    setIsProcessing(true);
    
    try {
      const followersMap = new Map();
      followersData.forEach((wrapper) => {
        wrapper.string_list_data.forEach((item) => {
          followersMap.set(item.value, true);
        });
      });

      const notFollow = [];
      followingData.relationships_following.forEach((wrapper) => {
        wrapper.string_list_data.forEach((item) => {
          if (!followersMap.has(item.value)) {
            notFollow.push({ 
              username: item.value, 
              href: item.href,
              timestamp: item.timestamp ? new Date(item.timestamp * 1000) : null
            });
          }
        });
      });

      setNotFollowBack(notFollow);
      setFilteredNotFollowBack(notFollow);
      setError('');
      setActiveTab('results');
    } catch (err) {
      setError('Invalid JSON format or structure.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Filter and sort effects
  useEffect(() => {
    let result = notFollowBack;
    
    // Apply search filter
    if (searchTerm) {
      result = result.filter(item => 
        item.username.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply sorting
    if (sortConfig.key) {
      result = [...result].sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    
    setFilteredNotFollowBack(result);
  }, [searchTerm, notFollowBack, sortConfig]);

  // Request sort
  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Format date
  const formatDate = (date) => {
    if (!date) return 'Unknown';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen px-4 py-12 bg-gradient-to-br from-gray-50 to-gray-100 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Instagram Follower Analyzer
          </h1>
          <p className="mt-3 text-xl text-gray-600">
            Discover who isn't following you back
          </p>
        </div>

        {/* Card Container */}
        <div className="overflow-hidden bg-white shadow-lg rounded-xl">
          {/* Tabs */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('instructions')}
              className={`px-6 py-3 text-sm font-medium ${activeTab === 'instructions' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Instructions
            </button>
            <button
              onClick={() => setActiveTab('upload')}
              className={`px-6 py-3 text-sm font-medium ${activeTab === 'upload' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Upload Files
            </button>
            <button
              onClick={() => setActiveTab('results')}
              className={`px-6 py-3 text-sm font-medium ${activeTab === 'results' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              disabled={notFollowBack.length === 0}
            >
              Results {notFollowBack.length > 0 && `(${notFollowBack.length})`}
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Instructions Tab */}
            {activeTab === 'instructions' && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-800">How to use this tool</h2>
                <ol className="pl-5 space-y-2 text-gray-700 list-decimal">
                  <li>Go to your Instagram account settings</li>
                  <li>Select "Privacy and Security"</li>
                  <li>Click "Download Data" under "Data Download"</li>
                  <li>Wait for Instagram to email you your data (may take up to 48 hours)</li>
                  <li>Extract the downloaded ZIP file</li>
                  <li>Upload the <code className="px-1 bg-gray-100 rounded">followers_1.json</code> and <code className="px-1 bg-gray-100 rounded">following.json</code> files</li>
                </ol>
                <div className="p-4 mt-4 border-l-4 border-blue-400 bg-blue-50">
                  <p className="text-blue-700">Your data never leaves your browser. This tool processes everything locally for your privacy.</p>
                </div>
              </div>
            )}

            {/* Upload Tab */}
            {activeTab === 'upload' && (
              <div className="space-y-6">
                {/* Dropzone */}
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'}`}
                >
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <svg className={`w-12 h-12 ${dragActive ? 'text-blue-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                    </svg>
                    <p className={`text-lg ${dragActive ? 'text-blue-600 font-medium' : 'text-gray-600'}`}>
                      {dragActive ? 'Drop your files here' : 'Drag & drop your JSON files here'}
                    </p>
                    <p className="text-sm text-gray-500">or select files manually below</p>
                  </div>
                </div>

                {/* Manual Upload */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className={`p-4 rounded-lg border ${followersData ? 'border-green-200 bg-green-50' : 'border-gray-200'}`}>
                    <label className="block mb-2 text-sm font-medium text-gray-700">
                      Followers File
                      {followersData && <span className="px-2 py-1 ml-2 text-xs text-green-800 bg-green-100 rounded-full">Uploaded</span>}
                    </label>
                    <div className="flex items-center">
                      <label className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                        <span>{followersData ? 'Change file' : 'Select file'}</span>
                        <input 
                          type="file" 
                          accept=".json" 
                          onChange={(e) => handleSelectFile(e, 'followers')} 
                          className="sr-only" 
                        />
                      </label>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">Usually named followers_1.json</p>
                  </div>

                  <div className={`p-4 rounded-lg border ${followingData ? 'border-green-200 bg-green-50' : 'border-gray-200'}`}>
                    <label className="block mb-2 text-sm font-medium text-gray-700">
                      Following File
                      {followingData && <span className="px-2 py-1 ml-2 text-xs text-green-800 bg-green-100 rounded-full">Uploaded</span>}
                    </label>
                    <div className="flex items-center">
                      <label className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                        <span>{followingData ? 'Change file' : 'Select file'}</span>
                        <input 
                          type="file" 
                          accept=".json" 
                          onChange={(e) => handleSelectFile(e, 'following')} 
                          className="sr-only" 
                        />
                      </label>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">Usually named following.json</p>
                  </div>
                </div>

                {/* Process Button */}
                <div className="pt-2">
                  <button
                    onClick={process}
                    disabled={!followersData || !followingData || isProcessing}
                    className={`w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${(!followersData || !followingData) ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'} transition-colors`}
                  >
                    {isProcessing ? (
                      <>
                        <svg className="w-4 h-4 mr-2 -ml-1 text-white animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </>
                    ) : 'Analyze Followers'}
                  </button>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="p-3 mt-4 border-l-4 border-red-400 rounded bg-red-50">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}
              </div>
            )}

            {/* Results Tab */}
            {activeTab === 'results' && (
              <div>
                {notFollowBack.length > 0 ? (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-bold text-gray-800">
                        Accounts not following you back
                      </h2>
                      <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                        {filteredNotFollowBack.length} of {notFollowBack.length} accounts
                      </span>
                    </div>

                    {/* Filter and Sort Controls */}
                    <div className="grid grid-cols-1 gap-4 mb-4 md:grid-cols-2">
                      <div>
                        <label htmlFor="search" className="block mb-1 text-sm font-medium text-gray-700">Search</label>
                        <div className="relative rounded-md shadow-sm">
                          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                            <svg className="w-5 h-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <input
                            type="text"
                            id="search"
                            className="block w-full py-2 pl-10 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            placeholder="Filter usernames..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                          />
                          {searchTerm && (
                            <button
                              onClick={() => setSearchTerm('')}
                              className="absolute inset-y-0 right-0 flex items-center pr-3"
                            >
                              <svg className="w-5 h-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </div>
                      <div>
                        <label className="block mb-1 text-sm font-medium text-gray-700">Sort by</label>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => requestSort('username')}
                            className={`px-3 py-1 text-sm rounded-md ${sortConfig.key === 'username' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                          >
                            Username {sortConfig.key === 'username' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                          </button>
                          <button
                            onClick={() => requestSort('timestamp')}
                            className={`px-3 py-1 text-sm rounded-md ${sortConfig.key === 'timestamp' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                          >
                            Date {sortConfig.key === 'timestamp' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Results List */}
                    <div className="overflow-hidden rounded-lg shadow ring-1 ring-black ring-opacity-5">
                      <ul className="divide-y divide-gray-200">
                        {filteredNotFollowBack.length > 0 ? (
                          filteredNotFollowBack.map((item, i) => (
                            <li key={i} className="hover:bg-gray-50">
                              <a
                                href={item.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block px-4 py-3 text-blue-600 hover:text-blue-800 hover:underline"
                              >
                                <div className="flex items-center">
                                  <span className="inline-flex items-center justify-center w-8 h-8 mr-3 bg-gray-200 rounded-full">
                                    <span className="text-sm font-medium text-gray-600">{item.username.charAt(0).toUpperCase()}</span>
                                  </span>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium truncate">{item.username}</p>
                                    {item.timestamp && (
                                      <p className="text-xs text-gray-500">
                                        Followed you on {formatDate(item.timestamp)}
                                      </p>
                                    )}
                                  </div>
                                  <svg className="w-5 h-5 ml-auto text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                  </svg>
                                </div>
                              </a>
                            </li>
                          ))
                        ) : (
                          <li className="px-4 py-6 text-center text-gray-500">
                            No accounts match your search criteria
                          </li>
                        )}
                      </ul>
                    </div>

                    <div className="flex items-center justify-between mt-4">
                      <div className="text-sm text-gray-500">
                        Showing {filteredNotFollowBack.length} of {notFollowBack.length} accounts
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            const text = filteredNotFollowBack.map(item => item.username).join('\n');
                            navigator.clipboard.writeText(text);
                          }}
                          className="inline-flex items-center px-3 py-2 text-sm font-medium leading-4 text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          <svg className="-ml-0.5 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                          </svg>
                          Copy Filtered
                        </button>
                        <button
                          onClick={() => {
                            const text = notFollowBack.map(item => item.username).join('\n');
                            navigator.clipboard.writeText(text);
                          }}
                          className="inline-flex items-center px-3 py-2 text-sm font-medium leading-4 text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          <svg className="-ml-0.5 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                          </svg>
                          Copy All
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-8 text-center">
                    <svg className="w-12 h-12 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No results yet</h3>
                    <p className="mt-1 text-sm text-gray-500">Upload your files and click "Analyze Followers" to see who's not following you back.</p>
                    <div className="mt-6">
                      <button
                        onClick={() => setActiveTab('upload')}
                        className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <svg className="w-5 h-5 mr-2 -ml-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                        Upload Files
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-sm text-center text-gray-500">
          <p>This tool works entirely in your browser. Your data is never uploaded to any server.</p>
        </div>
      </div>
    </div>
  );
}

export default App;