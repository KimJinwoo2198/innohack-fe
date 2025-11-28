import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import PregnantWoman from "../assets/pregnant_woman.svg";
import { baseGet } from "../services/_base";

const STYLES_ENDPOINT = "/api/user-styles/list-styles/";

const StyleSelector = () => {
  const [styles, setStyles] = useState([]);
  const [selectedStyle, setSelectedStyle] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStyles = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await baseGet(STYLES_ENDPOINT);
        setStyles(response.data);
      } catch (error) {
        console.error('Error fetching styles:', error);
        setError('스타일을 불러오는 중 오류가 발생했습니다. 다시 시도해 주세요.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStyles();
  }, []);

  const handleContinue = () => {
    if (selectedStyle) {
      navigate('/home');
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.1,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 16, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { 
        type: "spring",
        stiffness: 120,
        damping: 14
      }
    }
  };

  return (
    <div className="flex flex-col h-screen bg-white">
      <header className="bg-white p-5 safe-top">
        <h1 className="text-xl font-bold tracking-tight">대화 스타일 선택</h1>
      </header>

      <main className="flex-grow overflow-y-auto p-5">
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="w-28 h-28 mx-auto mb-6"
        >
          <img src={PregnantWoman} alt="임신한 여자 이모지" className="w-full h-full" />
        </motion.div>

        <AnimatePresence>
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {isLoading ? (
              <div className="flex justify-center items-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : error ? (
              <div className="text-red-500 text-center text-sm">{error}</div>
            ) : (
              styles.map((style) => (
                <motion.button
                  key={style.id}
                  variants={itemVariants}
                  onClick={() => setSelectedStyle(style.id)}
                  className={`w-full text-left bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-3 transition-all duration-200 active:scale-[0.99] ${
                    selectedStyle === style.id ? 'ring-2 ring-primary' : ''
                  }`}
                >
                  <h2 className="text-base font-semibold text-gray-900">{style.name}</h2>
                  <div className="flex justify-between items-center mt-1.5">
                    <span className="text-xs text-gray-500">탭하여 선택</span>
                    <ChevronRight className={`text-[#d3d3d3] transition-transform duration-200 ${
                      selectedStyle === style.id ? 'transform rotate-90' : ''
                    }`} />
                  </div>
                </motion.button>
              ))
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      <footer className="p-5 safe-bottom">
        <motion.button
          onClick={handleContinue}
          disabled={!selectedStyle || isLoading}
          className="w-full py-4 bg-primary text-white rounded-xl font-semibold text-base shadow-sm disabled:bg-gray-400 disabled:cursor-not-allowed"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          선택 완료
        </motion.button>
      </footer>
    </div>
  );
};

export default StyleSelector;