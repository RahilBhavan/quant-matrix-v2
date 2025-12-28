import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Position, Order } from '../types';

interface PortfolioState {
  cash: number;
  positions: Position[];
  orders: Order[];
  totalEquity: number;
  buyingPower: number;
}

interface PortfolioContextType {
  state: PortfolioState;
  buyStock: (symbol: string, quantity: number, price: number) => void;
  sellStock: (symbol: string, quantity: number, price: number) => void;
  updatePositionPrice: (symbol: string, currentPrice: number) => void;
  addOrder: (order: Omit<Order, 'id' | 'createdAt'>) => void;
  cancelOrder: (orderId: string) => void;
  updateOrderStatus: (orderId: string, status: Order['status']) => void;
  fillOrder: (orderId: string, fillPrice: number) => void;
  getPosition: (symbol: string) => Position | undefined;
  hasPosition: (symbol: string) => boolean;
  getTotalPL: () => number;
  getTotalPLPercent: () => number;
  resetPortfolio: () => void;
}

const PortfolioContext = createContext<PortfolioContextType | undefined>(undefined);

const INITIAL_BALANCE = 100000;

export const PortfolioProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<PortfolioState>({
    cash: INITIAL_BALANCE,
    positions: [],
    orders: [],
    totalEquity: INITIAL_BALANCE,
    buyingPower: INITIAL_BALANCE,
  });

  const buyStock = useCallback((symbol: string, quantity: number, price: number) => {
    const cost = quantity * price;

    setState(prev => {
      if (prev.cash < cost) {
        console.error('Insufficient funds');
        return prev;
      }

      const existingPosition = prev.positions.find(p => p.symbol === symbol);

      let newPositions: Position[];
      if (existingPosition) {
        const totalQuantity = existingPosition.quantity + quantity;
        const totalCost = existingPosition.avgPrice * existingPosition.quantity + cost;
        const newAvgPrice = totalCost / totalQuantity;

        newPositions = prev.positions.map(p =>
          p.symbol === symbol
            ? {
                ...p,
                quantity: totalQuantity,
                avgPrice: newAvgPrice,
                unrealizedPL: (p.currentPrice - newAvgPrice) * totalQuantity,
                unrealizedPLPercent: ((p.currentPrice - newAvgPrice) / newAvgPrice) * 100,
              }
            : p
        );
      } else {
        newPositions = [
          ...prev.positions,
          {
            symbol,
            quantity,
            avgPrice: price,
            currentPrice: price,
            unrealizedPL: 0,
            unrealizedPLPercent: 0,
          },
        ];
      }

      const newCash = prev.cash - cost;
      const totalEquity = newCash + newPositions.reduce((sum, p) => sum + p.currentPrice * p.quantity, 0);

      return {
        ...prev,
        cash: newCash,
        positions: newPositions,
        totalEquity,
        buyingPower: newCash,
      };
    });
  }, []);

  const sellStock = useCallback((symbol: string, quantity: number, price: number) => {
    setState(prev => {
      const position = prev.positions.find(p => p.symbol === symbol);
      if (!position || position.quantity < quantity) {
        console.error('Insufficient shares to sell');
        return prev;
      }

      const proceeds = quantity * price;
      const newCash = prev.cash + proceeds;

      let newPositions: Position[];
      if (position.quantity === quantity) {
        newPositions = prev.positions.filter(p => p.symbol !== symbol);
      } else {
        newPositions = prev.positions.map(p =>
          p.symbol === symbol
            ? {
                ...p,
                quantity: p.quantity - quantity,
                unrealizedPL: (p.currentPrice - p.avgPrice) * (p.quantity - quantity),
                unrealizedPLPercent: ((p.currentPrice - p.avgPrice) / p.avgPrice) * 100,
              }
            : p
        );
      }

      const totalEquity = newCash + newPositions.reduce((sum, p) => sum + p.currentPrice * p.quantity, 0);

      return {
        ...prev,
        cash: newCash,
        positions: newPositions,
        totalEquity,
        buyingPower: newCash,
      };
    });
  }, []);

  const updatePositionPrice = useCallback((symbol: string, currentPrice: number) => {
    setState(prev => {
      const newPositions = prev.positions.map(p =>
        p.symbol === symbol
          ? {
              ...p,
              currentPrice,
              unrealizedPL: (currentPrice - p.avgPrice) * p.quantity,
              unrealizedPLPercent: ((currentPrice - p.avgPrice) / p.avgPrice) * 100,
            }
          : p
      );

      const totalEquity = prev.cash + newPositions.reduce((sum, p) => sum + p.currentPrice * p.quantity, 0);

      return {
        ...prev,
        positions: newPositions,
        totalEquity,
      };
    });
  }, []);

  const addOrder = useCallback((order: Omit<Order, 'id' | 'createdAt'>) => {
    setState(prev => ({
      ...prev,
      orders: [
        ...prev.orders,
        {
          ...order,
          id: `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          createdAt: new Date(),
        },
      ],
    }));
  }, []);

  const cancelOrder = useCallback((orderId: string) => {
    setState(prev => ({
      ...prev,
      orders: prev.orders.filter(o => o.id !== orderId),
    }));
  }, []);

  const updateOrderStatus = useCallback((orderId: string, status: Order['status']) => {
    setState(prev => ({
      ...prev,
      orders: prev.orders.map(o =>
        o.id === orderId ? { ...o, status } : o
      ),
    }));
  }, []);

  const fillOrder = useCallback((orderId: string, fillPrice: number) => {
    setState(prev => {
      const order = prev.orders.find(o => o.id === orderId);
      if (!order || order.status !== 'PENDING') {
        return prev;
      }

      // Execute the order
      if (order.side === 'BUY') {
        const cost = order.quantity * fillPrice;
        if (prev.cash < cost) {
          // Mark as cancelled if insufficient funds
          return {
            ...prev,
            orders: prev.orders.map(o =>
              o.id === orderId ? { ...o, status: 'CANCELLED' as const } : o
            ),
          };
        }

        // Execute buy
        const existingPosition = prev.positions.find(p => p.symbol === order.symbol);
        let newPositions: Position[];

        if (existingPosition) {
          const totalQuantity = existingPosition.quantity + order.quantity;
          const totalCost = existingPosition.avgPrice * existingPosition.quantity + cost;
          const newAvgPrice = totalCost / totalQuantity;

          newPositions = prev.positions.map(p =>
            p.symbol === order.symbol
              ? {
                  ...p,
                  quantity: totalQuantity,
                  avgPrice: newAvgPrice,
                  unrealizedPL: (p.currentPrice - newAvgPrice) * totalQuantity,
                  unrealizedPLPercent: ((p.currentPrice - newAvgPrice) / newAvgPrice) * 100,
                }
              : p
          );
        } else {
          newPositions = [
            ...prev.positions,
            {
              symbol: order.symbol,
              quantity: order.quantity,
              avgPrice: fillPrice,
              currentPrice: fillPrice,
              unrealizedPL: 0,
              unrealizedPLPercent: 0,
            },
          ];
        }

        const newCash = prev.cash - cost;
        const totalEquity = newCash + newPositions.reduce((sum, p) => sum + p.currentPrice * p.quantity, 0);

        return {
          ...prev,
          cash: newCash,
          positions: newPositions,
          totalEquity,
          buyingPower: newCash,
          orders: prev.orders.map(o =>
            o.id === orderId ? { ...o, status: 'FILLED' as const } : o
          ),
        };
      } else {
        // SELL
        const position = prev.positions.find(p => p.symbol === order.symbol);
        if (!position || position.quantity < order.quantity) {
          // Mark as cancelled if insufficient shares
          return {
            ...prev,
            orders: prev.orders.map(o =>
              o.id === orderId ? { ...o, status: 'CANCELLED' as const } : o
            ),
          };
        }

        const proceeds = order.quantity * fillPrice;
        const newCash = prev.cash + proceeds;

        let newPositions: Position[];
        if (position.quantity === order.quantity) {
          newPositions = prev.positions.filter(p => p.symbol !== order.symbol);
        } else {
          newPositions = prev.positions.map(p =>
            p.symbol === order.symbol
              ? {
                  ...p,
                  quantity: p.quantity - order.quantity,
                  unrealizedPL: (p.currentPrice - p.avgPrice) * (p.quantity - order.quantity),
                  unrealizedPLPercent: ((p.currentPrice - p.avgPrice) / p.avgPrice) * 100,
                }
              : p
          );
        }

        const totalEquity = newCash + newPositions.reduce((sum, p) => sum + p.currentPrice * p.quantity, 0);

        return {
          ...prev,
          cash: newCash,
          positions: newPositions,
          totalEquity,
          buyingPower: newCash,
          orders: prev.orders.map(o =>
            o.id === orderId ? { ...o, status: 'FILLED' as const } : o
          ),
        };
      }
    });
  }, []);

  const getPosition = useCallback((symbol: string): Position | undefined => {
    return state.positions.find(p => p.symbol === symbol);
  }, [state.positions]);

  const hasPosition = useCallback((symbol: string): boolean => {
    return state.positions.some(p => p.symbol === symbol);
  }, [state.positions]);

  const getTotalPL = useCallback((): number => {
    const totalPositionPL = state.positions.reduce((sum, p) => sum + p.unrealizedPL, 0);
    return totalPositionPL + (state.totalEquity - INITIAL_BALANCE);
  }, [state.positions, state.totalEquity]);

  const getTotalPLPercent = useCallback((): number => {
    const totalPL = getTotalPL();
    return (totalPL / INITIAL_BALANCE) * 100;
  }, [getTotalPL]);

  const resetPortfolio = useCallback(() => {
    setState({
      cash: INITIAL_BALANCE,
      positions: [],
      orders: [],
      totalEquity: INITIAL_BALANCE,
      buyingPower: INITIAL_BALANCE,
    });
  }, []);

  return (
    <PortfolioContext.Provider
      value={{
        state,
        buyStock,
        sellStock,
        updatePositionPrice,
        addOrder,
        cancelOrder,
        updateOrderStatus,
        fillOrder,
        getPosition,
        hasPosition,
        getTotalPL,
        getTotalPLPercent,
        resetPortfolio,
      }}
    >
      {children}
    </PortfolioContext.Provider>
  );
};

export const usePortfolio = () => {
  const context = useContext(PortfolioContext);
  if (!context) {
    throw new Error('usePortfolio must be used within PortfolioProvider');
  }
  return context;
};
