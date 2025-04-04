import { jsx as _jsx } from "react/jsx-runtime";
import { useCallback, useEffect, useRef, useState } from 'react';
const BottomSheet = ({ children, snapPoints, initialSnapIndex = 0, onSnapChange, }) => {
    const sheetRef = useRef(null);
    const touchRef = useRef({
        startY: 0,
        startHeight: 0,
        timestamps: [],
        positions: [],
    });
    const [snapIndex, setSnapIndex] = useState(initialSnapIndex);
    useEffect(() => {
        if (sheetRef.current) {
            sheetRef.current.style.height = snapPoints[snapIndex];
        }
    }, [snapIndex, snapPoints]);
    const handleTouchStart = useCallback((e) => {
        if (!sheetRef.current)
            return;
        const touch = e.touches[0];
        const sheet = sheetRef.current;
        const height = sheet.getBoundingClientRect().height;
        touchRef.current = {
            startY: touch.clientY,
            startHeight: height,
            timestamps: [Date.now()],
            positions: [touch.clientY],
        };
        sheet.style.transition = 'none';
    }, []);
    const handleTouchMove = useCallback((e) => {
        e.preventDefault();
        if (!sheetRef.current)
            return;
        const touch = e.touches[0];
        const sheet = sheetRef.current;
        const { startY, startHeight } = touchRef.current;
        const currentY = touch.clientY;
        const deltaY = currentY - startY;
        const newHeight = Math.max(0, startHeight - deltaY);
        touchRef.current.timestamps.push(Date.now());
        touchRef.current.positions.push(currentY);
        const now = Date.now();
        const cutoffTime = now - 100;
        while (touchRef.current.timestamps.length > 0 &&
            touchRef.current.timestamps[0] < cutoffTime) {
            touchRef.current.timestamps.shift();
            touchRef.current.positions.shift();
        }
        const maxHeight = parseInt(snapPoints[snapPoints.length - 1], 10);
        const minHeight = parseInt(snapPoints[0], 10);
        let dampenedHeight = newHeight;
        if (newHeight > maxHeight) {
            const overshoot = newHeight - maxHeight;
            dampenedHeight = maxHeight + Math.sqrt(overshoot);
        }
        else if (newHeight < minHeight) {
            const undershoot = minHeight - newHeight;
            dampenedHeight = minHeight - Math.sqrt(undershoot);
        }
        sheet.style.height = `${dampenedHeight}px`;
    }, [snapPoints]);
    const handleTouchEnd = useCallback(() => {
        if (!sheetRef.current)
            return;
        const sheet = sheetRef.current;
        const timestamps = touchRef.current.timestamps;
        const positions = touchRef.current.positions;
        let velocity = 0;
        if (timestamps.length >= 2) {
            const dt = timestamps[timestamps.length - 1] - timestamps[0];
            const dy = positions[positions.length - 1] - positions[0];
            if (dt > 0) {
                velocity = dy / dt;
            }
        }
        const currentHeight = sheet.getBoundingClientRect().height;
        let nextSnapIndex = snapIndex;
        let minDiff = Infinity;
        snapPoints.forEach((point, index) => {
            const snapHeight = parseInt(point, 10);
            const diff = Math.abs(snapHeight - currentHeight);
            if (diff < minDiff) {
                minDiff = diff;
                nextSnapIndex = index;
            }
        });
        if (Math.abs(velocity) > 0.5) {
            if (velocity < -0.5 && nextSnapIndex < snapPoints.length - 1) {
                nextSnapIndex++;
            }
            else if (velocity > 0.5 && nextSnapIndex > 0) {
                nextSnapIndex--;
            }
        }
        sheet.style.transition = 'height 0.35s cubic-bezier(0.4, 0, 0.2, 1)';
        sheet.style.height = snapPoints[nextSnapIndex];
        if (nextSnapIndex !== snapIndex) {
            setSnapIndex(nextSnapIndex);
            onSnapChange?.(nextSnapIndex);
        }
    }, [snapIndex, snapPoints, onSnapChange]);
    useEffect(() => {
        const sheet = sheetRef.current;
        if (!sheet)
            return;
        sheet.style.height = snapPoints[snapIndex];
        sheet.addEventListener('touchstart', handleTouchStart, { passive: true });
        sheet.addEventListener('touchmove', handleTouchMove, { passive: false });
        sheet.addEventListener('touchend', handleTouchEnd, { passive: false });
        return () => {
            if (sheet) {
                sheet.removeEventListener('touchstart', handleTouchStart);
                sheet.removeEventListener('touchmove', handleTouchMove);
                sheet.removeEventListener('touchend', handleTouchEnd);
            }
        };
    }, [handleTouchStart, handleTouchMove, handleTouchEnd, snapIndex, snapPoints]);
    return (_jsx("div", { ref: sheetRef, className: "fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-lg transition-height duration-300 ease-in-out overflow-hidden", style: { height: snapPoints[initialSnapIndex] }, children: children }));
};
export default BottomSheet;
//# sourceMappingURL=BottomSheet.js.map