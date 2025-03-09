// client-side rendered
"use client";

import { useEffect, useRef, useState } from "react";

export default function Canvas() {
	// update canvas without rerender -> useref
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const [isDrawing, setIsDrawing] = useState(false);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		// canvas context allows us to manipulate
		// the canvas
		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		// modify context
		ctx.lineWidth = 5;
		ctx.lineCap = "round";
		ctx.strokeStyle = "black";

		// handlers to begin a path, follow
		// and close path. secret sauce
		const startDrawing = (e: MouseEvent) => {
			ctx.beginPath();
			ctx.moveTo(e.offsetX, e.offsetY);
			setIsDrawing(true);
		};

		const draw = (e: MouseEvent) => {
			if (!isDrawing) return;
			ctx.lineTo(e.offsetX, e.offsetY);
			ctx.stroke();	
		};

		const stopDrawing = (e: MouseEvent) => {
			setIsDrawing(false);
			ctx.closePath();
		};

		// apply handlers
		canvas.addEventListener("mousedown", startDrawing);
		canvas.addEventListener("mousemove", draw);
		canvas.addEventListener("mouseup", stopDrawing);
		canvas.addEventListener("mouseleave", stopDrawing);

		// when we return erase handlers
		return () => {
			canvas.removeEventListener("mousedown", startDrawing);
			canvas.removeEventListener("mousemove", draw);
			canvas.removeEventListener("mouseup", stopDrawing);
			canvas.removeEventListener("mouseleave", stopDrawing);
		};
	}, [isDrawing]);


	// return div with canvas
	return (
		<div className="flex justify-center items-center h-screen bg-gray-100">
			<canvas ref={canvasRef} width={800} height={500} className="border bg-white" />
		</div>
	);
}
