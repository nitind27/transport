"use client";
import React, { useEffect } from "react";


import Button from "../../ui/button/Button";
import { Modal } from "../../ui/modal";

import { useModal } from "@/hooks/useModal";
import { useToggleContext } from "@/context/ToggleContext";

interface FormInModalProps {
  inputfiled: React.ReactNode;
  title?: string;
  classname?: string;
  submitbutton: React.ReactNode;
}

export default function BhautikModal({
  inputfiled,
  title,
  classname,
  submitbutton
}: FormInModalProps) {
  const { isOpen, openModal, closeModal } = useModal();
  const { isActive, setIsActive, setIsEditmode, isModelopen, setIsmodelopen, setisvalidation } = useToggleContext();

  useEffect(() => {
    if (isActive) {
      openModal();
      setIsActive(false)
    }


  }, [isActive, openModal]);

  useEffect(() => {

    if (!isModelopen) {
      closeModal();
    }
  }, [isModelopen, closeModal]);

  const handleclose = () => {
    closeModal()
    setIsEditmode(false)
    setIsActive(false)
    setisvalidation(false)


  }
  const handlepenmodel = () => {
    openModal()
    setIsmodelopen(true)
  }
  return (
    <>

      <div className="left-0 flex">

        <Button size="sm" onClick={handlepenmodel}>
          Add
        </Button>
      </div>

      <Modal
        isOpen={isOpen}

        onClose={handleclose}
        className={`max-w-[1000px] p-5 lg:p-10 ${classname}`}
      >

        <form className="text-left">
          <h4 className="mb-6 text-lg font-medium text-gray-800 dark:text-white/90 text-left ">
            {title}
          </h4>

          {inputfiled}

          <div className="flex items-center justify-end w-full gap-3 mt-6">
            <button className='bg-gray-600 text-white py-2 p-2 rounded' onClick={handleclose}>
              Close
            </button>

            {submitbutton}
          </div>
        </form>
      </Modal>
    </>

  );
}
