import React, { useState, useEffect, useCallback } from 'react';
import { LegoBlock, BlockParams, Protocol } from '../../types';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Typography } from '../ui/Typography';
import { Select } from '../ui/Select';
import { Slider } from '../ui/Slider';

interface BlockConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  block: LegoBlock | null;
  onUpdate: (blockId: string, params: BlockParams) => void;
}

// Protocol colors for modal header
const PROTOCOL_COLORS: Record<Protocol, string> = {
  [Protocol.UNISWAP]: '#FF007A',
  [Protocol.AAVE]: '#B6509E',
  [Protocol.COMPOUND]: '#00D395',
  [Protocol.LOGIC]: '#FFD93D',
  [Protocol.RISK]: '#6C63FF',
  [Protocol.ENTRY]: '#00FF9D',
  [Protocol.EXIT]: '#FF4444',
  [Protocol.ORDERS]: '#8247E5',
  [Protocol.INDICATORS]: '#FFD93D',
};

// Configuration for all possible parameters across blocks
const PARAM_CONFIGS: Record<string, {
  label: string;
  type: 'text' | 'number' | 'percentage' | 'select';
  options?: { value: string; label: string }[];
  min?: number;
  max?: number;
  step?: number;
  validate?: (value: any) => string | null; // Returns error message or null
  warning?: (value: any) => string | null; // Returns warning message or null
}> = {
  tokenIn: {
    label: 'TOKEN IN',
    type: 'select',
    options: [
      { value: 'USDC', label: 'USDC' },
      { value: 'WETH', label: 'WETH' },
      { value: 'DAI', label: 'DAI' },
      { value: 'WBTC', label: 'WBTC' },
    ],
  },
  tokenOut: {
    label: 'TOKEN OUT',
    type: 'select',
    options: [
      { value: 'USDC', label: 'USDC' },
      { value: 'WETH', label: 'WETH' },
      { value: 'DAI', label: 'DAI' },
      { value: 'WBTC', label: 'WBTC' },
    ],
  },
  amount: {
    label: 'AMOUNT',
    type: 'number',
    min: 0,
    validate: (value) => {
      if (value === undefined || value === '') return null; // Allow empty (not required)
      if (isNaN(Number(value))) return 'ERR: INVALID NUMBER';
      if (Number(value) <= 0) return 'ERR: AMOUNT MUST BE > 0';
      return null;
    },
  },
  slippage: {
    label: 'SLIPPAGE TOLERANCE',
    type: 'percentage',
    min: 0.1,
    max: 5,
    step: 0.1,
    validate: (value) => {
      if (value < 0.1) return 'ERR: MIN SLIPPAGE IS 0.1%';
      if (value > 5) return 'ERR: MAX SLIPPAGE IS 5%';
      return null;
    },
    warning: (value) => {
      if (value > 2) return 'WARN: HIGH SLIPPAGE MAY CAUSE LOSS';
      return null;
    },
  },
  asset: {
    label: 'ASSET',
    type: 'select',
    options: [
      { value: 'USDC', label: 'USDC' },
      { value: 'WETH', label: 'WETH' },
      { value: 'DAI', label: 'DAI' },
    ],
  },
  supplyAmount: {
    label: 'SUPPLY AMOUNT',
    type: 'number',
    min: 0,
    validate: (value) => {
      if (value !== undefined && Number(value) < 0) return 'ERR: AMOUNT CANNOT BE NEGATIVE';
      return null;
    },
  },
  borrowAmount: {
    label: 'BORROW AMOUNT',
    type: 'number',
    min: 0,
    validate: (value) => {
      if (value !== undefined && Number(value) < 0) return 'ERR: AMOUNT CANNOT BE NEGATIVE';
      return null;
    },
    warning: (value) => {
      if (Number(value) > 10000) return 'WARN: LARGE BORROW POSITION';
      return null;
    },
  },
  condition: { label: 'CONDITION', type: 'text' },
  threshold: {
    label: 'THRESHOLD',
    type: 'number',
    validate: (value) => {
      if (value !== undefined && isNaN(Number(value))) return 'ERR: INVALID NUMBER';
      return null;
    },
  },
  percentage: {
    label: 'PERCENTAGE',
    type: 'percentage',
    min: 0,
    max: 100,
    step: 1,
    validate: (value) => {
      if (value < 0 || value > 100) return 'ERR: MUST BE 0-100%';
      return null;
    },
  },
  token0: {
    label: 'TOKEN 0',
    type: 'select',
    options: [
      { value: 'USDC', label: 'USDC' },
      { value: 'WETH', label: 'WETH' },
    ],
  },
  token1: {
    label: 'TOKEN 1',
    type: 'select',
    options: [
      { value: 'USDC', label: 'USDC' },
      { value: 'WETH', label: 'WETH' },
    ],
  },
  feeTier: {
    label: 'FEE TIER',
    type: 'select',
    options: [
      { value: '500', label: '0.05%' },
      { value: '3000', label: '0.30%' },
      { value: '10000', label: '1.00%' },
    ],
  },
};

export const BlockConfigModal: React.FC<BlockConfigModalProps> = ({
  isOpen,
  onClose,
  block,
  onUpdate,
}) => {
  const [localParams, setLocalParams] = useState<BlockParams>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [warnings, setWarnings] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (block?.params) {
      setLocalParams({ ...block.params });
      setErrors({});
      setWarnings({});
      setTouched({});
    }
  }, [block]);

  // Validate a single field
  const validateField = useCallback((key: string, value: any) => {
    const config = PARAM_CONFIGS[key];
    if (!config) return;

    const newErrors = { ...errors };
    const newWarnings = { ...warnings };

    // Check validation
    if (config.validate) {
      const error = config.validate(value);
      if (error) {
        newErrors[key] = error;
      } else {
        delete newErrors[key];
      }
    }

    // Check warnings
    if (config.warning) {
      const warning = config.warning(value);
      if (warning) {
        newWarnings[key] = warning;
      } else {
        delete newWarnings[key];
      }
    }

    setErrors(newErrors);
    setWarnings(newWarnings);
  }, [errors, warnings]);

  // Handle field blur (validation trigger)
  const handleBlur = useCallback((key: string) => {
    setTouched((prev) => ({ ...prev, [key]: true }));
    validateField(key, localParams[key as keyof BlockParams]);
  }, [localParams, validateField]);

  // Validate all fields before save
  const validateAll = useCallback(() => {
    const newErrors: Record<string, string> = {};
    const newWarnings: Record<string, string> = {};

    Object.keys(localParams).forEach((key) => {
      const config = PARAM_CONFIGS[key];
      if (!config) return;

      if (config.validate) {
        const error = config.validate(localParams[key as keyof BlockParams]);
        if (error) newErrors[key] = error;
      }

      if (config.warning) {
        const warning = config.warning(localParams[key as keyof BlockParams]);
        if (warning) newWarnings[key] = warning;
      }
    });

    setErrors(newErrors);
    setWarnings(newWarnings);
    setTouched(
      Object.keys(localParams).reduce((acc, key) => ({ ...acc, [key]: true }), {})
    );

    return Object.keys(newErrors).length === 0;
  }, [localParams]);

  if (!block) return null;

  const handleSave = () => {
    if (validateAll()) {
      onUpdate(block.id, localParams);
      onClose();
    }
  };

  const hasErrors = Object.keys(errors).length > 0;
  const protocolColor = PROTOCOL_COLORS[block.protocol] || '#0A0A0A';

  const renderField = (key: string, value: any) => {
    const config = PARAM_CONFIGS[key];
    if (!config) return null;

    const fieldError = touched[key] ? errors[key] : null;
    const fieldWarning = touched[key] ? warnings[key] : null;

    return (
      <div key={key} className="mb-4">
        <Typography variant="small" className="uppercase text-xs font-bold text-gray-500 mb-2 block">
          {config.label}
          {fieldWarning && (
            <span className="ml-2 text-orange" title={fieldWarning}>▲</span>
          )}
        </Typography>

        {config.type === 'select' && config.options ? (
          <Select
            value={String(value || '')}
            options={config.options}
            onChange={(val) => setLocalParams({ ...localParams, [key]: val })}
            error={!!fieldError}
          />
        ) : config.type === 'percentage' ? (
          <Slider
            value={Number(value) || config.min || 0}
            min={config.min || 0}
            max={config.max || 100}
            step={config.step || 1}
            unit="%"
            onChange={(val) => {
              setLocalParams({ ...localParams, [key]: val });
              validateField(key, val);
            }}
          />
        ) : (
          <Input
            value={value ?? ''}
            type={config.type === 'number' ? 'number' : 'text'}
            onChange={(e) => {
              const newValue = config.type === 'number'
                ? (e.target.value === '' ? undefined : parseFloat(e.target.value))
                : e.target.value;
              setLocalParams({ ...localParams, [key]: newValue });
            }}
            onBlur={() => handleBlur(key)}
            className="w-full"
            monospace
            error={!!fieldError}
          />
        )}

        {/* Error Message */}
        {fieldError && (
          <Typography variant="small" className="text-error font-mono mt-1">
            {fieldError}
          </Typography>
        )}

        {/* Warning Message (only if no error) */}
        {!fieldError && fieldWarning && (
          <Typography variant="small" className="text-orange font-mono mt-1">
            {fieldWarning}
          </Typography>
        )}
      </div>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`CONFIGURE: ${block.label}`}
      protocolColor={protocolColor}
    >
      <div className="space-y-2">
        {/* Render fields based on block params */}
        {Object.keys(localParams).map((key) =>
          renderField(key, localParams[key as keyof BlockParams])
        )}

        {/* No params message */}
        {Object.keys(localParams).length === 0 && (
          <Typography variant="body" className="text-gray-500 text-center py-4">
            NO CONFIGURABLE PARAMETERS
          </Typography>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t border-border mt-6">
          <Button variant="secondary" onClick={onClose}>
            CANCEL
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={hasErrors}
          >
            SAVE CONFIGURATION
          </Button>
        </div>
      </div>
    </Modal>
  );
};
