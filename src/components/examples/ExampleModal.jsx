import React from 'react';
import Modal, { ModalHeader, ModalBody, ModalFooter } from '../ui/Modal';
import useModal from '../../hooks/useModal';

const ExampleModal = () => {
  const { isOpen, open, close } = useModal({
    initialState: false,
    animationDuration: 300
  });

  return (
    <div className="p-4">
      <button
        onClick={open}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        Open Modal
      </button>

      <Modal
        isOpen={isOpen}
        onClose={close}
        title="Example Modal"
        size="md"
        showCloseButton
        closeOnOverlayClick
        closeOnEsc
      >
        <ModalHeader>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Welcome to Our Modal
          </h2>
        </ModalHeader>

        <ModalBody>
          <p className="text-gray-600 dark:text-gray-300">
            This is an example of how to use the Modal component with the useModal hook.
            The modal includes a header, body, and footer with proper styling and animations.
          </p>
        </ModalBody>

        <ModalFooter>
          <button
            onClick={close}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              // Handle confirm action
              close();
            }}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Confirm
          </button>
        </ModalFooter>
      </Modal>
    </div>
  );
};

export default ExampleModal; 