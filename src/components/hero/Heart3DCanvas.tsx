import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

interface Heart3DProps {
  className?: string;
}

export const Heart3DCanvas: React.FC<Heart3DProps> = ({ className = '' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasWebGL, setHasWebGL] = useState(true);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Check WebGL availability
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) {
        setHasWebGL(false);
        return;
      }
    } catch {
      setHasWebGL(false);
      return;
    }

    const width = container.clientWidth || 320;
    const height = container.clientHeight || 320;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.z = 6;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      container.appendChild(renderer.domElement);
    } catch {
      setHasWebGL(false);
      return;
    }

    // Soft Studio Lighting
    const ambientLight = new THREE.AmbientLight(0xfff3e6, 1.4);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.6);
    dirLight1.position.set(5, 5, 5);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xF4B6C2, 1.2);
    dirLight2.position.set(-4, -2, 3);
    scene.add(dirLight2);

    const pointLight = new THREE.PointLight(0xD9B26F, 1.5, 10);
    pointLight.position.set(0, 0, 3);
    scene.add(pointLight);

    // Group for whole 3D sculpture
    const heartGroup = new THREE.Group();

    // Create Heart Shape
    const x = 0, y = 0;
    const heartShape = new THREE.Shape();
    heartShape.moveTo(x + 0.25, y + 0.25);
    heartShape.bezierCurveTo(x + 0.25, y + 0.25, x + 0.2, y, x, y);
    heartShape.bezierCurveTo(x - 0.55, y, x - 0.55, y + 0.7, x - 0.55, y + 0.7);
    heartShape.bezierCurveTo(x - 0.55, y + 1.1, x - 0.3, y + 1.54, x + 0.25, y + 1.9);
    heartShape.bezierCurveTo(x + 0.8, y + 1.54, x + 1.05, y + 1.1, x + 1.05, y + 0.7);
    heartShape.bezierCurveTo(x + 1.05, y + 0.7, x + 1.05, y, x + 0.5, y);
    heartShape.bezierCurveTo(x + 0.35, y, x + 0.25, y + 0.25, x + 0.25, y + 0.25);

    const extrudeSettings: THREE.ExtrudeGeometryOptions = {
      depth: 0.35,
      bevelEnabled: true,
      bevelSegments: 16,
      steps: 2,
      bevelSize: 0.14,
      bevelThickness: 0.15
    };

    const heartGeo = new THREE.ExtrudeGeometry(heartShape, extrudeSettings);
    // Center heart
    heartGeo.center();
    // Rotate to face front upright
    heartGeo.rotateZ(Math.PI);
    heartGeo.scale(1.3, 1.3, 1.3);

    // Pastel Pink Clay Material
    const clayMaterial = new THREE.MeshStandardMaterial({
      color: 0xF4B6C2, // Soft Pastel Pink
      roughness: 0.45,
      metalness: 0.05
    });

    const heartMesh = new THREE.Mesh(heartGeo, clayMaterial);
    heartGroup.add(heartMesh);

    // Embossed Gold Keyhole (Gembok Hati)
    const keyholeGroup = new THREE.Group();
    const circleGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.45, 24);
    circleGeo.rotateX(Math.PI / 2);
    const goldMaterial = new THREE.MeshStandardMaterial({
      color: 0xD9B26F, // Soft Gold
      roughness: 0.3,
      metalness: 0.6
    });
    const keyholeTop = new THREE.Mesh(circleGeo, goldMaterial);
    keyholeTop.position.set(0, 0.08, 0.08);

    const slotGeo = new THREE.BoxGeometry(0.1, 0.18, 0.45);
    const keyholeBottom = new THREE.Mesh(slotGeo, goldMaterial);
    keyholeBottom.position.set(0, -0.04, 0.08);

    keyholeGroup.add(keyholeTop);
    keyholeGroup.add(keyholeBottom);

    // Laurel leaf accents (little golden laurel sprigs around heart base)
    const laurelGeo = new THREE.TorusGeometry(0.85, 0.03, 12, 32, Math.PI * 0.9);
    const laurelMesh = new THREE.Mesh(laurelGeo, goldMaterial);
    laurelMesh.rotation.z = Math.PI * 1.05;
    laurelMesh.position.set(0, -0.2, 0.05);
    keyholeGroup.add(laurelMesh);

    heartGroup.add(keyholeGroup);
    scene.add(heartGroup);

    // Mouse & Gyro tracking
    let targetRotationX = 0;
    let targetRotationY = 0;

    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      const rect = container.getBoundingClientRect();
      const nx = ((clientX - rect.left) / rect.width) * 2 - 1;
      const ny = -(((clientY - rect.top) / rect.height) * 2 - 1);
      targetRotationY = nx * 0.6;
      targetRotationX = -ny * 0.4;
    };

    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('touchmove', handlePointerMove, { passive: true });

    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Gentle floating and breathing
      heartGroup.position.y = Math.sin(elapsedTime * 1.5) * 0.08;

      // Smooth interpolation to target cursor rotation + gentle continuous idle rotation
      heartGroup.rotation.y += (targetRotationY + Math.sin(elapsedTime * 0.8) * 0.2 - heartGroup.rotation.y) * 0.05;
      heartGroup.rotation.x += (targetRotationX + Math.cos(elapsedTime * 0.9) * 0.08 - heartGroup.rotation.x) * 0.05;

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      const newW = container.clientWidth || 320;
      const newH = container.clientHeight || 320;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('resize', handleResize);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      heartGeo.dispose();
      clayMaterial.dispose();
      goldMaterial.dispose();
      circleGeo.dispose();
      slotGeo.dispose();
      laurelGeo.dispose();
    };
  }, []);

  if (!hasWebGL) {
    return (
      <div className={`relative flex items-center justify-center ${className}`}>
        <div className="w-48 h-48 rounded-full bg-[#F4B6C2]/30 flex items-center justify-center p-4 border border-[#F4B6C2] shadow-inner animate-pulse">
          <div className="text-center">
            <span className="text-6xl select-none">💖</span>
            <div className="text-xs font-semibold text-[#7A1018] mt-2 uppercase tracking-widest">Savero & Soffie</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-[280px] sm:h-[340px] md:h-[380px] flex items-center justify-center cursor-grab active:cursor-grabbing ${className}`}
      title="Hati 3D Pastel Savero & Soffie - Gerakkan kursor atau miringkan layar untuk memutar"
    />
  );
};
