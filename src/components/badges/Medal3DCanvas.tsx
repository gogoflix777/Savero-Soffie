import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { BadgeTier } from '../../types';

interface Medal3DCanvasProps {
  tier: BadgeTier;
  iconType: string;
  isUnlocked: boolean;
  className?: string;
  size?: number;
  interactive?: boolean;
  autoRotateSpeed?: number;
}

export const Medal3DCanvas: React.FC<Medal3DCanvasProps> = ({
  tier,
  iconType,
  isUnlocked,
  className = '',
  size = 240,
  interactive = true,
  autoRotateSpeed = 0.012
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasWebGL, setHasWebGL] = useState(true);
  const [isFlipped, setIsFlipped] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    try {
      const testCanvas = document.createElement('canvas');
      const gl = testCanvas.getContext('webgl') || testCanvas.getContext('experimental-webgl');
      if (!gl) {
        setHasWebGL(false);
        return;
      }
    } catch {
      setHasWebGL(false);
      return;
    }

    const width = size;
    const height = size;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 0, 4.4);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.25;
      container.appendChild(renderer.domElement);
    } catch {
      setHasWebGL(false);
      return;
    }

    // Studio Environment lighting using PMREMGenerator & RoomEnvironment for realistic reflections
    try {
      const pmremGenerator = new THREE.PMREMGenerator(renderer);
      scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
      pmremGenerator.dispose();
    } catch {
      // Fallback lighting if RoomEnvironment fails
    }

    // Three-point Studio Lighting
    const ambientLight = new THREE.AmbientLight(0xfff8f0, 1.8);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffeedd, 2.8);
    keyLight.position.set(3.5, 4.5, 4.0);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xf4b6c2, 1.6);
    fillLight.position.set(-3.5, -2.0, 3.0);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xd9b26f, 2.2);
    rimLight.position.set(0, 3.5, -3.5);
    scene.add(rimLight);

    const medalRootGroup = new THREE.Group();

    // Determine Tier Aesthetics
    let baseColor = 0xd9b26f;
    let rimColor = 0xb3883a;
    let metalness = 0.88;
    let roughness = 0.18;
    let ribbonColorA = 0xd9b26f;
    let ribbonColorB = 0x7a1018;

    if (!isUnlocked) {
      baseColor = 0x6e6e6e;
      rimColor = 0x555555;
      metalness = 0.3;
      roughness = 0.55;
      ribbonColorA = 0x555555;
      ribbonColorB = 0x333333;
    } else if (tier === 'perunggu') {
      baseColor = 0xcd7f32;
      rimColor = 0x8b4513;
      metalness = 0.75;
      roughness = 0.28;
      ribbonColorA = 0x8b4513;
      ribbonColorB = 0xd9b26f;
    } else if (tier === 'perak') {
      baseColor = 0xe4e4e7;
      rimColor = 0xa1a1aa;
      metalness = 0.92;
      roughness = 0.14;
      ribbonColorA = 0x94a3b8;
      ribbonColorB = 0x475569;
    } else if (tier === 'emas') {
      baseColor = 0xffd700;
      rimColor = 0xd9b26f;
      metalness = 0.95;
      roughness = 0.15;
      ribbonColorA = 0xd9b26f;
      ribbonColorB = 0x7a1018;
    } else if (tier === 'hati') {
      baseColor = 0x7a1018;
      rimColor = 0xf4b6c2;
      metalness = 0.7;
      roughness = 0.22;
      ribbonColorA = 0x7a1018;
      ribbonColorB = 0xf4b6c2;
    }

    // 1. Medal Base Coin Disc
    const coinGeo = new THREE.CylinderGeometry(1.22, 1.22, 0.2, 64);
    coinGeo.rotateX(Math.PI / 2);

    const coinMat = new THREE.MeshStandardMaterial({
      color: baseColor,
      metalness,
      roughness
    });
    const coinMesh = new THREE.Mesh(coinGeo, coinMat);
    medalRootGroup.add(coinMesh);

    // 2. Beveled Metallic Outer Rim
    const rimGeo = new THREE.TorusGeometry(1.22, 0.08, 16, 64);
    const rimMat = new THREE.MeshStandardMaterial({
      color: rimColor,
      metalness: Math.min(1.0, metalness + 0.08),
      roughness: Math.max(0.08, roughness - 0.05)
    });
    const rimMesh = new THREE.Mesh(rimGeo, rimMat);
    medalRootGroup.add(rimMesh);

    // 3. Inner Laurel / Beaded Decorative Ring (Front)
    const innerRingGeo = new THREE.TorusGeometry(0.98, 0.035, 12, 48);
    const innerRingMat = new THREE.MeshStandardMaterial({
      color: rimColor,
      metalness: 0.9,
      roughness: 0.12
    });
    const frontInnerRing = new THREE.Mesh(innerRingGeo, innerRingMat);
    frontInnerRing.position.z = 0.105;
    medalRootGroup.add(frontInnerRing);

    // Inner Laurel Ring (Back)
    const backInnerRing = new THREE.Mesh(innerRingGeo, innerRingMat);
    backInnerRing.position.z = -0.105;
    medalRootGroup.add(backInnerRing);

    // 4. Central 3D Embossed Front Emblem
    const frontEmblemGroup = new THREE.Group();

    if (iconType === 'hati' || tier === 'hati') {
      const hShape = new THREE.Shape();
      hShape.moveTo(0, 0);
      hShape.bezierCurveTo(0, 0.25, -0.3, 0.45, -0.5, 0.45);
      hShape.bezierCurveTo(-0.8, 0.45, -0.8, 0, -0.8, 0);
      hShape.bezierCurveTo(-0.8, -0.28, -0.4, -0.6, 0, -0.9);
      hShape.bezierCurveTo(0.4, -0.6, 0.8, -0.28, 0.8, 0);
      hShape.bezierCurveTo(0.8, 0, 0.8, 0.45, 0.5, 0.45);
      hShape.bezierCurveTo(0.3, 0.45, 0, 0.25, 0, 0);

      const hExtrude = new THREE.ExtrudeGeometry(hShape, {
        depth: 0.14,
        bevelEnabled: true,
        bevelSegments: 8,
        steps: 1,
        bevelSize: 0.06,
        bevelThickness: 0.06
      });
      hExtrude.center();
      hExtrude.scale(0.68, 0.68, 0.68);
      hExtrude.rotateZ(Math.PI);

      const hMat = new THREE.MeshStandardMaterial({
        color: isUnlocked ? (tier === 'hati' ? 0xf4b6c2 : 0x7a1018) : 0x888888,
        metalness: 0.8,
        roughness: 0.2
      });
      const hMesh = new THREE.Mesh(hExtrude, hMat);
      hMesh.position.z = 0.14;
      frontEmblemGroup.add(hMesh);
    } else if (iconType === 'palu') {
      // 3D Justice Gavel (Savero - Hukum)
      const headGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.72, 24);
      headGeo.rotateZ(Math.PI / 2);
      const headMesh = new THREE.Mesh(headGeo, rimMat);
      headMesh.position.set(0, 0.15, 0.14);

      const handleGeo = new THREE.CylinderGeometry(0.06, 0.07, 0.82, 16);
      handleGeo.rotateZ(Math.PI / 3);
      const handleMesh = new THREE.Mesh(handleGeo, rimMat);
      handleMesh.position.set(0, -0.12, 0.14);

      frontEmblemGroup.add(headMesh);
      frontEmblemGroup.add(handleMesh);
    } else if (iconType === 'stetoskop') {
      // 3D Stethoscope (Soffie - Keperawatan)
      const tubeGeo = new THREE.TorusGeometry(0.42, 0.045, 12, 40, Math.PI * 1.35);
      const tubeMesh = new THREE.Mesh(tubeGeo, rimMat);
      tubeMesh.position.set(0, 0.12, 0.14);

      const chestPieceGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.08, 24);
      chestPieceGeo.rotateX(Math.PI / 2);
      const chestMesh = new THREE.Mesh(chestPieceGeo, rimMat);
      chestMesh.position.set(0, -0.32, 0.14);

      frontEmblemGroup.add(tubeMesh);
      frontEmblemGroup.add(chestMesh);
    } else if (iconType === 'cangkir') {
      // 3D Coffee Cup
      const cupGeo = new THREE.CylinderGeometry(0.28, 0.22, 0.44, 24);
      cupGeo.rotateX(Math.PI / 2);
      const cupMesh = new THREE.Mesh(cupGeo, rimMat);
      cupMesh.position.set(-0.06, 0, 0.14);

      const handleGeo = new THREE.TorusGeometry(0.16, 0.04, 12, 24, Math.PI);
      const handleMesh = new THREE.Mesh(handleGeo, rimMat);
      handleMesh.position.set(0.26, 0, 0.14);
      handleMesh.rotateZ(-Math.PI / 2);

      frontEmblemGroup.add(cupMesh);
      frontEmblemGroup.add(handleMesh);
    } else {
      // Star / Diamond Relief
      const octaGeo = new THREE.OctahedronGeometry(0.55, 0);
      octaGeo.scale(1, 1, 0.38);
      const octaMesh = new THREE.Mesh(octaGeo, rimMat);
      octaMesh.position.z = 0.14;
      frontEmblemGroup.add(octaMesh);
    }

    medalRootGroup.add(frontEmblemGroup);

    // 5. Backside Engraved Seal ("SAVERO & SOFFIE - 26.08.2026")
    const backGroup = new THREE.Group();
    backGroup.rotation.y = Math.PI;

    // Back Seal Relief: Concentric Medallion with Laurel sprigs
    const sealDiscGeo = new THREE.CylinderGeometry(0.85, 0.85, 0.04, 48);
    sealDiscGeo.rotateX(Math.PI / 2);
    const sealMat = new THREE.MeshStandardMaterial({
      color: rimColor,
      metalness: 0.9,
      roughness: 0.15
    });
    const sealDisc = new THREE.Mesh(sealDiscGeo, sealMat);
    sealDisc.position.z = 0.11;
    backGroup.add(sealDisc);

    // Small Heart in center of back
    const backHeartShape = new THREE.Shape();
    backHeartShape.moveTo(0, 0);
    backHeartShape.bezierCurveTo(0, 0.15, -0.2, 0.28, -0.32, 0.28);
    backHeartShape.bezierCurveTo(-0.5, 0.28, -0.5, 0, -0.5, 0);
    backHeartShape.bezierCurveTo(-0.5, -0.18, -0.25, -0.38, 0, -0.55);
    backHeartShape.bezierCurveTo(0.25, -0.38, 0.5, -0.18, 0.5, 0);
    backHeartShape.bezierCurveTo(0.5, 0, 0.5, 0.28, 0.32, 0.28);
    backHeartShape.bezierCurveTo(0.2, 0.28, 0, 0.15, 0, 0);

    const backHeartExtrude = new THREE.ExtrudeGeometry(backHeartShape, {
      depth: 0.06,
      bevelEnabled: true,
      bevelSegments: 4,
      bevelSize: 0.03,
      bevelThickness: 0.03
    });
    backHeartExtrude.center();
    backHeartExtrude.scale(0.5, 0.5, 0.5);
    backHeartExtrude.rotateZ(Math.PI);

    const backHeartMesh = new THREE.Mesh(backHeartExtrude, coinMat);
    backHeartMesh.position.z = 0.16;
    backGroup.add(backHeartMesh);

    medalRootGroup.add(backGroup);

    // 6. Realistic 3D Striped Ribbon Hanger
    const ribbonShape = new THREE.Shape();
    ribbonShape.moveTo(-0.48, 1.22);
    ribbonShape.lineTo(0.48, 1.22);
    ribbonShape.lineTo(0.65, 2.15);
    ribbonShape.lineTo(-0.65, 2.15);
    ribbonShape.closePath();

    const ribbonGeo = new THREE.ExtrudeGeometry(ribbonShape, {
      depth: 0.04,
      bevelEnabled: false
    });

    const ribbonMat = new THREE.MeshStandardMaterial({
      color: ribbonColorA,
      roughness: 0.82,
      metalness: 0.1
    });
    const ribbonMesh = new THREE.Mesh(ribbonGeo, ribbonMat);
    ribbonMesh.position.z = -0.04;
    medalRootGroup.add(ribbonMesh);

    // Ribbon Stripe Center
    const stripeShape = new THREE.Shape();
    stripeShape.moveTo(-0.16, 1.22);
    stripeShape.lineTo(0.16, 1.22);
    stripeShape.lineTo(0.22, 2.15);
    stripeShape.lineTo(-0.22, 2.15);
    stripeShape.closePath();

    const stripeGeo = new THREE.ExtrudeGeometry(stripeShape, {
      depth: 0.045,
      bevelEnabled: false
    });
    const stripeMat = new THREE.MeshStandardMaterial({
      color: ribbonColorB,
      roughness: 0.85,
      metalness: 0.08
    });
    const stripeMesh = new THREE.Mesh(stripeGeo, stripeMat);
    stripeMesh.position.z = -0.035;
    medalRootGroup.add(stripeMesh);

    // 7. Golden Eyelet Ring connecting ribbon and coin
    const eyeletGeo = new THREE.TorusGeometry(0.18, 0.045, 12, 32);
    const eyeletMesh = new THREE.Mesh(eyeletGeo, rimMat);
    eyeletMesh.position.set(0, 1.24, 0);
    medalRootGroup.add(eyeletMesh);

    // Floating 3D Sparkle Particles around medal if unlocked
    let particleMesh: THREE.InstancedMesh | null = null;
    if (isUnlocked) {
      const sparkleGeo = new THREE.OctahedronGeometry(0.04, 0);
      const sparkleMat = new THREE.MeshBasicMaterial({
        color: tier === 'hati' ? 0xf4b6c2 : 0xffe082,
        transparent: true,
        opacity: 0.85
      });
      particleMesh = new THREE.InstancedMesh(sparkleGeo, sparkleMat, 16);
      const dummy = new THREE.Object3D();
      for (let i = 0; i < 16; i++) {
        const radius = 1.4 + Math.random() * 0.7;
        const theta = (i / 16) * Math.PI * 2;
        dummy.position.set(Math.cos(theta) * radius, Math.sin(theta) * radius + 0.2, (Math.random() - 0.5) * 0.8);
        dummy.scale.setScalar(Math.random() * 0.8 + 0.6);
        dummy.updateMatrix();
        particleMesh.setMatrixAt(i, dummy.matrix);
      }
      medalRootGroup.add(particleMesh);
    }

    scene.add(medalRootGroup);

    // Interaction state: Drag to rotate & inertia damping
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;
    let targetRotY = isFlipped ? Math.PI : 0;
    let targetRotX = 0;

    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      if (!interactive) return;
      isDragging = true;
      const x = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const y = 'touches' in e ? e.touches[0].clientY : e.clientY;
      prevMouseX = x;
      prevMouseY = y;
    };

    const onPointerMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging || !interactive) return;
      const x = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const y = 'touches' in e ? e.touches[0].clientY : e.clientY;
      const deltaX = x - prevMouseX;
      const deltaY = y - prevMouseY;
      targetRotY += deltaX * 0.02;
      targetRotX += deltaY * 0.015;
      // Clamp vertical tilt
      targetRotX = Math.max(-0.6, Math.min(0.6, targetRotX));
      prevMouseX = x;
      prevMouseY = y;
    };

    const onPointerUp = () => {
      isDragging = false;
    };

    container.addEventListener('mousedown', onPointerDown);
    window.addEventListener('mousemove', onPointerMove);
    window.addEventListener('mouseup', onPointerUp);

    container.addEventListener('touchstart', onPointerDown, { passive: true });
    window.addEventListener('touchmove', onPointerMove, { passive: true });
    window.addEventListener('touchend', onPointerUp);

    let animationFrameId: number;
    let isVisible = true;
    const clock = new THREE.Clock();

    const animate = () => {
      if (!isVisible) return;
      animationFrameId = requestAnimationFrame(animate);
      const time = clock.getElapsedTime();

      // Gentle floating elevation
      medalRootGroup.position.y = Math.sin(time * 2.2) * 0.08;

      if (!isDragging) {
        targetRotY += autoRotateSpeed;
      }

      // Smooth exponential damping
      medalRootGroup.rotation.y += (targetRotY - medalRootGroup.rotation.y) * 0.08;
      medalRootGroup.rotation.x += (targetRotX + Math.sin(time * 1.8) * 0.04 - medalRootGroup.rotation.x) * 0.08;

      // Subtle Ribbon swaying physics
      ribbonMesh.rotation.z = Math.sin(time * 2.5) * 0.03;
      stripeMesh.rotation.z = Math.sin(time * 2.5) * 0.03;

      renderer.render(scene, camera);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (!isVisible) {
              isVisible = true;
              clock.start();
              animate();
            }
          } else {
            isVisible = false;
            cancelAnimationFrame(animationFrameId);
          }
        });
      },
      { threshold: 0.05 }
    );
    observer.observe(container);

    animate();

    return () => {
      observer.disconnect();
      cancelAnimationFrame(animationFrameId);
      container.removeEventListener('mousedown', onPointerDown);
      window.removeEventListener('mousemove', onPointerMove);
      window.removeEventListener('mouseup', onPointerUp);
      container.removeEventListener('touchstart', onPointerDown);
      window.removeEventListener('touchmove', onPointerMove);
      window.removeEventListener('touchend', onPointerUp);

      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      coinGeo.dispose();
      rimGeo.dispose();
      innerRingGeo.dispose();
      ribbonGeo.dispose();
      stripeGeo.dispose();
      eyeletGeo.dispose();
      coinMat.dispose();
      rimMat.dispose();
      innerRingMat.dispose();
      ribbonMat.dispose();
      stripeMat.dispose();
    };
  }, [tier, iconType, isUnlocked, size, interactive, autoRotateSpeed, isFlipped]);

  if (!hasWebGL) {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <div className="w-28 h-28 rounded-full border-4 border-[#D9B26F] bg-[#7A1018] text-[#EFE6DA] flex items-center justify-center font-bold">
          Medali 3D
        </div>
      </div>
    );
  }

  return (
    <div className="relative inline-flex flex-col items-center">
      <div
        ref={containerRef}
        className={`relative flex items-center justify-center cursor-grab active:cursor-grabbing select-none transition-transform hover:scale-105 ${className}`}
        title="Sentuh atau geser untuk memutar medali 3D ke depan dan belakang"
      />
      {interactive && (
        <div className="flex items-center space-x-2 mt-1">
          <button
            type="button"
            onClick={() => setIsFlipped((prev) => !prev)}
            className="text-[10px] font-sans-clean font-bold text-[#7A1018] dark:text-[#F4B6C2] bg-white/70 dark:bg-black/40 hover:bg-[#7A1018] hover:text-white dark:hover:bg-[#F4B6C2] dark:hover:text-[#7A1018] px-2.5 py-1 rounded-full border border-[#7A1018]/20 transition shadow-xs flex items-center space-x-1"
          >
            <span>Balik Sisi &rarr;</span>
          </button>
        </div>
      )}
    </div>
  );
};
