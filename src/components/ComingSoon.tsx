import { useState, useEffect } from 'react';
import { FaTools, FaClock, FaArrowLeft, FaBell } from 'react-icons/fa';
import Link from 'next/link';

interface ComingSoonProps {
  title?: string;
  description?: string;
  returnPath?: string;
  returnLabel?: string;
  darkMode?: boolean;
  featureName?: string;
  estimatedRelease?: string;
}

/**
 * ComingSoon Component
 * 
 * A responsive page to display when features are under development.
 * Can be used as a standalone page or embedded in other components.
 */
const ComingSoon: React.FC<ComingSoonProps> = ({
  title = 'Coming Soon!',
  description = 'This feature is currently under development. Our team is working hard to bring it to you soon.',
  returnPath = '/',
  returnLabel = 'Return to Dashboard',
  darkMode = true,
  featureName = 'This feature',
  estimatedRelease = 'soon'
}) => {
  // Track countdown for dynamic release date messaging
  const [countdown, setCountdown] = useState<number>(99);

  // Simple countdown timer for effect
  useEffect(() => {
    if (countdown <= 0) return;
    
    const timer = setTimeout(() => {
      setCountdown(prev => Math.max(0, prev - 1));
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [countdown]);

  return (
    <div className={`min-h-screen flex flex-col justify-center items-center p-6 ${
      darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-800'
    }`}>
      <div className={`relative w-full max-w-2xl ${
        darkMode ? 'bg-gray-800' : 'bg-white'
      } rounded-xl shadow-xl overflow-hidden`}>
        {/* Decorative top bar */}
        <div className={`absolute top-0 inset-x-0 h-2 ${
          darkMode ? 'bg-indigo-600' : 'bg-indigo-500'
        }`}></div>
        
        {/* Content container */}
        <div className="p-8 md:p-12 pt-10">
          {/* Main icon */}
          <div className="flex justify-center mb-6">
            <div className={`p-5 rounded-full ${
              darkMode ? 'bg-gray-700 text-indigo-400' : 'bg-indigo-100 text-indigo-600'
            }`}>
              <FaTools size={40} />
            </div>
          </div>
          
          {/* Title and description */}
          <h1 className="text-2xl md:text-3xl font-bold text-center mb-3">{title}</h1>
          <p className={`text-center mb-8 ${
            darkMode ? 'text-gray-300' : 'text-gray-600'
          }`}>
            {description}
          </p>
          
          {/* Feature details card */}
          <div className={`rounded-lg p-6 mb-8 ${
            darkMode ? 'bg-gray-750 border border-gray-700' : 'bg-gray-50 border border-gray-200'
          }`}>
            <h3 className="font-semibold mb-4 flex items-center">
              <FaClock className={`mr-2 ${
                darkMode ? 'text-indigo-400' : 'text-indigo-600'
              }`} />
              Development Timeline
            </h3>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>Feature:</span>
                <span className="font-medium">{featureName}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>Status:</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  darkMode ? 'bg-yellow-800 text-yellow-200' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  In Development
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>Expected Release:</span>
                <span className="font-medium">{estimatedRelease}</span>
              </div>
              
              <div className="w-full bg-gray-700 rounded-full h-2.5 mt-3">
                <div
                  className="bg-indigo-600 h-2.5 rounded-full"
                  style={{ width: `${(100 - countdown)}%` }}
                ></div>
              </div>
            </div>
          </div>
          
          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              href={returnPath}
              className={`flex items-center justify-center py-3 px-6 rounded-lg font-medium transition-colors ${
                darkMode
                  ? 'bg-gray-700 text-white hover:bg-gray-600'
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
            >
              <FaArrowLeft className="mr-2" />
              {returnLabel}
            </Link>
            
            <button
              className={`flex items-center justify-center py-3 px-6 rounded-lg font-medium transition-colors ${
                darkMode
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                  : 'bg-indigo-500 text-white hover:bg-indigo-600'
              }`}
            >
              <FaBell className="mr-2" />
              Notify Me When Ready
            </button>
          </div>
        </div>
      </div>
      
      {/* Additional information footer */}
      <p className={`mt-8 text-sm ${
        darkMode ? 'text-gray-400' : 'text-gray-500'
      }`}>
        Have suggestions for this feature? <a href="mailto:support@tutorji.in" className={`underline ${
          darkMode ? 'text-indigo-400 hover:text-indigo-300' : 'text-indigo-600 hover:text-indigo-700'
        }`}>Share your feedback</a>
      </p>
    </div>
  );
};

export default ComingSoon; 