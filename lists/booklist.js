import React, { useState, useEffect } from 'react';
import { BookOpen, Clock, Star } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const STATUSES = [
  { id: 'reading', label: 'Currently Reading', color: 'bg-blue-500' },
  { id: 'completed', label: 'Completed', color: 'bg-green-500' },
  { id: 'wishlist', label: 'Wish to Read', color: 'bg-purple-500' },
  { id: 'dropped', label: 'Dropped', color: 'bg-red-500' },
  { id: 'hold', label: 'On Hold', color: 'bg-yellow-500' }
];

export default function PublicBookTracker() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeStatus, setActiveStatus] = useState('all');
  const [timeView, setTimeView] = useState('month');

  useEffect(() => {
    loadBooks();
  }, []);

  const loadBooks = async () => {
    try {
      const response = await fetch('books.json');
      const data = await response.json();
      setBooks(data.books || []);
    } catch (error) {
      console.log('No books.json found');
      setBooks([]);
    } finally {
      setLoading(false);
    }
  };

  const getReadingStats = () => {
    const now = new Date();
    const stats = { day: 0, month: 0, year: 0, allTime: 0 };
    
    books.forEach(book => {
      const time = book.readingTime || 0;
      stats.allTime += time;
      
      if (book.endDate) {
        const endDate = new Date(book.endDate);
        const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        
        if (endDate >= dayAgo) stats.day += time;
        if (endDate >= monthAgo) stats.month += time;
        if (endDate >= yearAgo) stats.year += time;
      }
    });
    
    return stats;
  };

  const getChartData = () => {
    const stats = getReadingStats();
    
    switch(timeView) {
      case 'day':
        return [{ name: 'Today', hours: stats.day }];
      case 'month':
        return [{ name: 'This Month', hours: stats.month }];
      case 'year':
        return [{ name: 'This Year', hours: stats.year }];
      case 'alltime':
        return [{ name: 'All Time', hours: stats.allTime }];
      default:
        return [{ name: 'This Month', hours: stats.month }];
    }
  };

  const filteredBooks = activeStatus === 'all' 
    ? books 
    : books.filter(book => book.status === activeStatus);

  const getStatusInfo = (statusId) => {
    return STATUSES.find(s => s.id === statusId) || STATUSES[0];
  };

  const booksByStatus = STATUSES.map(status => ({
    ...status,
    count: books.filter(book => book.status === status.id).length
  }));

  const averageRating = books.filter(b => b.rating > 0).length > 0
    ? (books.filter(b => b.rating > 0).reduce((sum, b) => sum + b.rating, 0) / books.filter(b => b.rating > 0).length).toFixed(1)
    : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading books...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <BookOpen className="w-12 h-12 text-indigo-600 mr-3" />
            <h1 className="text-4xl md:text-5xl font-bold text-gray-800">My Reading Journey</h1>
          </div>
          <p className="text-gray-600 text-lg">Explore my personal library and reading habits</p>
        </div>

        {/* Reading Time Chart */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4 gap-4">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Clock className="w-6 h-6 text-indigo-600" />
              Reading Time Statistics
            </h2>
            <div className="flex gap-2 flex-wrap">
              {['day', 'month', 'year', 'alltime'].map(view => (
                <button
                  key={view}
                  onClick={() => setTimeView(view)}
                  className={`px-3 py-1 rounded-full text-sm transition-all ${
                    timeView === view
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {view === 'alltime' ? 'All Time' : view.charAt(0).toUpperCase() + view.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={getChartData()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis label={{ value: 'Hours', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Bar dataKey="hours" fill="#4f46e5" />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-4 text-center">
            <p className="text-gray-600">
              Total reading time: <span className="font-bold text-indigo-600">{getReadingStats().allTime} hours</span>
            </p>
            {averageRating > 0 && (
              <p className="text-gray-600 mt-1">
                Average rating: <span className="font-bold text-indigo-600">{averageRating}/5.0</span>
              </p>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-8">
          <button
            onClick={() => setActiveStatus('all')}
            className={`p-4 rounded-lg shadow-md transition-all ${
              activeStatus === 'all' 
                ? 'bg-indigo-600 text-white transform scale-105' 
                : 'bg-white text-gray-700 hover:shadow-lg'
            }`}
          >
            <div className="text-2xl font-bold">{books.length}</div>
            <div className="text-sm">All Books</div>
          </button>
          {booksByStatus.map(status => (
            <button
              key={status.id}
              onClick={() => setActiveStatus(status.id)}
              className={`p-4 rounded-lg shadow-md transition-all ${
                activeStatus === status.id 
                  ? `${status.color} text-white transform scale-105` 
                  : 'bg-white text-gray-700 hover:shadow-lg'
              }`}
            >
              <div className="text-2xl font-bold">{status.count}</div>
              <div className="text-sm">{status.label}</div>
            </button>
          ))}
        </div>

        {/* Books Grid */}
        {filteredBooks.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg shadow-md">
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No books found in this category</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBooks.map(book => {
              const statusInfo = getStatusInfo(book.status);
              return (
                <div key={book.id} className="bg-white rounded-lg shadow-md hover:shadow-xl transition-all overflow-hidden">
                  <div className={`h-2 ${statusInfo.color}`}></div>
                  <div className="p-5">
                    <div className="mb-3">
                      <h3 className="text-xl font-bold text-gray-800 mb-1">{book.title}</h3>
                      {book.author && (
                        <p className="text-gray-600 italic">by {book.author}</p>
                      )}
                    </div>
                    
                    <div className="mb-3">
                      <div className={`inline-block px-3 py-1 rounded-full text-white text-sm ${statusInfo.color}`}>
                        {statusInfo.label}
                      </div>
                    </div>

                    {book.rating > 0 && (
                      <div className="flex items-center gap-1 mb-2">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < book.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                            }`}
                          />
                        ))}
                        <span className="text-sm text-gray-600 ml-1">({book.rating}/5)</span>
                      </div>
                    )}

                    {book.readingTime > 0 && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                        <Clock className="w-4 h-4" />
                        <span>{book.readingTime} hours</span>
                      </div>
                    )}

                    {(book.startDate || book.endDate) && (
                      <div className="text-sm text-gray-500 mb-2">
                        {book.startDate && <div>Started: {new Date(book.startDate).toLocaleDateString()}</div>}
                        {book.endDate && <div>Finished: {new Date(book.endDate).toLocaleDateString()}</div>}
                      </div>
                    )}

                    {book.notes && (
                      <div className="mt-3 p-3 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg border-l-4 border-indigo-600">
                        <p className="text-xs text-indigo-600 font-semibold mb-1">Personal Review</p>
                        <p className="text-gray-700 text-sm italic">"{book.notes}"</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 text-center text-gray-500 text-sm">
          <p>📚 This is a personal book collection. Last updated: {new Date().toLocaleDateString()}</p>
        </div>
      </div>
    </div>
  );
}
