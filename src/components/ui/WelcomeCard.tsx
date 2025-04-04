import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface WelcomeCardProps {
  isVisible: boolean;
  onClose: () => void;
}

const WelcomeCard: React.FC<WelcomeCardProps> = ({ isVisible, onClose }) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, rotateX: 10, y: 20 }}
          animate={{
            opacity: 1,
            scale: 1,
            rotateX: 0,
            y: 0,
            transition: {
              duration: 0.4,
              ease: [0.4, 0, 0.2, 1],
            },
          }}
          exit={{
            opacity: 0,
            scale: 0.95,
            rotateX: 10,
            y: 20,
            transition: {
              duration: 0.2,
              ease: [0.4, 0, 1, 1],
            },
          }}
          className="fixed top-20 left-4 z-50 w-80 perspective-1000"
          style={{ transformStyle: 'preserve-3d' }}
        >
          <motion.div
            className="relative bg-gradient-to-br from-indigo-50/95 via-purple-50/95 to-pink-50/95 backdrop-blur-md rounded-2xl border border-white/30 shadow-[0_8px_32px_rgba(0,0,0,0.1)] overflow-hidden"
            style={{
              boxShadow: `
                0 8px 32px rgba(0,0,0,0.1),
                0 0 0 1px rgba(255,255,255,0.1) inset,
                0 0 0 1px rgba(255,255,255,0.05) inset,
                0 0 0 1px rgba(255,255,255,0.05) inset,
                0 0 0 1px rgba(255,255,255,0.05) inset
              `,
            }}
            whileHover={{
              scale: 1.02,
              rotateX: 2,
              transition: { duration: 0.2 },
            }}
          >
            {/* Animated gradient background */}
            <motion.div
              className="absolute inset-0 opacity-30"
              style={{
                background:
                  'radial-gradient(circle at 50% 50%, rgba(99,102,241,0.1), rgba(168,85,247,0.1), rgba(236,72,153,0.1))',
                filter: 'blur(40px)',
              }}
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.4, 0.3],
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />

            <div className="relative p-6 space-y-4">
              <div className="flex items-center justify-between">
                <motion.h2
                  className="text-2xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  WorldFinder
                </motion.h2>
                <motion.button
                  onClick={onClose}
                  className="text-gray-500 hover:text-gray-700 transition-colors p-1 rounded-full hover:bg-gray-100"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </motion.button>
              </div>

              <motion.p
                className="text-lg font-medium text-gray-800"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                Discover your world!
              </motion.p>

              <div className="space-y-3">
                <motion.p
                  className="text-gray-700 leading-relaxed"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  The only proximity-based app that brings your community to life with:
                </motion.p>

                <motion.ul
                  className="space-y-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  {[
                    { color: 'indigo', text: 'First-of-its-kind proximity chat' },
                    { color: 'purple', text: 'Urban treasure hunt adventures' },
                    { color: 'pink', text: 'Virtual real estate opportunities' },
                    { color: 'indigo', text: 'And so much more!' },
                  ].map((item, index) => (
                    <motion.li
                      key={index}
                      className="flex items-start group"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + index * 0.1 }}
                      whileHover={{ x: 5 }}
                    >
                      <span
                        className={`text-${item.color}-500 mr-2 group-hover:scale-110 transition-transform`}
                      >
                        •
                      </span>
                      <span className="text-gray-700 group-hover:text-gray-900 transition-colors">
                        {item.text}
                      </span>
                    </motion.li>
                  ))}
                </motion.ul>
              </div>

              <motion.div
                className="pt-4 border-t border-gray-200"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 }}
              >
                <p className="text-gray-700 font-medium">Calling all creators!</p>
                <p className="text-gray-600 text-sm mt-1">
                  Musicians, artists, vendors, and everyone in between - post your free one-hour
                  meetup and connect with your community today.
                </p>
              </motion.div>

              <motion.button
                onClick={onClose}
                className="w-full mt-4 px-4 py-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden group"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <span className="relative z-10">Click anywhere on the map</span>
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  initial={{ x: '-100%' }}
                  whileHover={{ x: '100%' }}
                  transition={{ duration: 0.5 }}
                />
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default WelcomeCard;
