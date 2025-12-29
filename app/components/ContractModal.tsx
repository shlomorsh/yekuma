"use client";

import { useRouter } from "next/navigation";

interface ContractModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ContractModal({ isOpen, onClose }: ContractModalProps) {
  const router = useRouter();

  if (!isOpen) return null;

  const handleGoToContract = () => {
    router.push("/contract");
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
      <div 
        className="bg-zinc-900 wireframe-border p-6 shadow-2xl w-full max-w-md mx-4" 
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
      >
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold mb-4" style={{ color: '#FFFFFF', fontFamily: 'var(--font-heebo)' }}>
            התחברות
          </h2>
          <p className="text-lg mb-6" style={{ color: '#FFFFFF', fontFamily: 'var(--font-mono)' }}>
            לצורך התחברות יש לחתום על חוזה
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleGoToContract}
            className="flex-1 control-panel-btn"
          >
            למעבר לחוזה
          </button>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-zinc-700 hover:bg-zinc-600 text-white font-semibold rounded-lg transition-colors duration-200"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            ביטול
          </button>
        </div>
      </div>
    </div>
  );
}

