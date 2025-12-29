/**
 * AriaStrategyList - Hidden Semantic HTML for Screen Readers
 *
 * Mirrors the 3D strategy blocks for accessibility tools:
 * - Semantic list structure with ARIA roles
 * - Live region for dynamic updates
 * - Keyboard-accessible block information
 * - Visually hidden but accessible to screen readers
 */

import React from 'react';
import { LegoBlock } from '../types';

interface AriaStrategyListProps {
    blocks: LegoBlock[];
    selectedBlockId?: string | null;
}

export const AriaStrategyList: React.FC<AriaStrategyListProps> = ({
    blocks,
    selectedBlockId,
}) => {
    if (blocks.length === 0) {
        return (
            <div className="sr-only" role="status" aria-live="polite">
                No strategy blocks added. Use the action ribbon to add blocks.
            </div>
        );
    }

    return (
        <nav
            className="sr-only"
            aria-label="Strategy blocks"
            role="navigation"
        >
            {/* Live region for announcements */}
            <div aria-live="polite" aria-atomic="true" role="status">
                Strategy contains {blocks.length} block{blocks.length !== 1 ? 's' : ''}.
                {selectedBlockId && (
                    <span>
                        {' '}Block {blocks.findIndex(b => b.id === selectedBlockId) + 1} selected.
                    </span>
                )}
            </div>

            {/* Semantic list of blocks */}
            <ul role="list" aria-label={`Strategy with ${blocks.length} blocks`}>
                {blocks.map((block, index) => (
                    <li
                        key={block.id}
                        aria-current={block.id === selectedBlockId ? 'true' : undefined}
                        aria-posinset={index + 1}
                        aria-setsize={blocks.length}
                    >
                        <article aria-label={`Block ${index + 1}: ${block.label}`}>
                            <h3>
                                Block {index + 1} of {blocks.length}: {block.label}
                            </h3>
                            <dl>
                                <dt>Type</dt>
                                <dd>{block.type}</dd>
                                <dt>Protocol</dt>
                                <dd>{block.protocol}</dd>
                                {block.params && Object.entries(block.params).map(([key, value]) => (
                                    <React.Fragment key={key}>
                                        <dt>{key}</dt>
                                        <dd>{String(value)}</dd>
                                    </React.Fragment>
                                ))}
                            </dl>
                        </article>
                    </li>
                ))}
            </ul>

            {/* Keyboard navigation hint */}
            <p>
                Use the mini-map or click blocks to select. Press R to reset view, F to focus on selected block.
            </p>
        </nav>
    );
};

export default AriaStrategyList;
