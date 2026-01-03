
import * as React from 'react';
import * as THREE from 'three';

const SpaceBackground: React.FC = () => {
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!containerRef.current) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    containerRef.current.appendChild(renderer.domElement);

    // Stars
    const starGeometry = new THREE.BufferGeometry();
    const starMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.7, transparent: true, opacity: 0.6 });
    const starVertices = [];
    for (let i = 0; i < 10000; i++) {
      const x = (Math.random() - 0.5) * 2000;
      const y = (Math.random() - 0.5) * 2000;
      const z = (Math.random() - 0.5) * 2000;
      starVertices.push(x, y, z);
    }
    starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);

    // Magic Particles (Mana)
    const manaGeometry = new THREE.BufferGeometry();
    const manaMaterial = new THREE.PointsMaterial({ color: 0x60a5fa, size: 1.5, transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending });
    const manaVertices = [];
    for (let i = 0; i < 500; i++) {
      const x = (Math.random() - 0.5) * 1000;
      const y = (Math.random() - 0.5) * 1000;
      const z = (Math.random() - 0.5) * 500;
      manaVertices.push(x, y, z);
    }
    manaGeometry.setAttribute('position', new THREE.Float32BufferAttribute(manaVertices, 3));
    const mana = new THREE.Points(manaGeometry, manaMaterial);
    scene.add(mana);

    // Earth (Human World)
    const earthGeometry = new THREE.SphereGeometry(15, 64, 64);
    const earthMaterial = new THREE.MeshPhongMaterial({
      color: 0x1d4ed8,
      emissive: 0x1e3a8a,
      shininess: 20,
    });
    const earth = new THREE.Mesh(earthGeometry, earthMaterial);
    earth.position.set(-80, -30, -150);
    scene.add(earth);

    // Isekai Planet (Glowy)
    const isekaiGeometry = new THREE.SphereGeometry(25, 64, 64);
    const isekaiMaterial = new THREE.MeshStandardMaterial({
      color: 0x7c3aed,
      emissive: 0x581c87,
      emissiveIntensity: 0.5,
      roughness: 0.4,
    });
    const isekai = new THREE.Mesh(isekaiGeometry, isekaiMaterial);
    isekai.position.set(100, 40, -250);
    scene.add(isekai);

    const pointLight = new THREE.PointLight(0xffffff, 2, 1000);
    pointLight.position.set(50, 50, 50);
    scene.add(pointLight);
    scene.add(new THREE.AmbientLight(0x202020, 1));

    camera.position.z = 50;

    const animate = () => {
      requestAnimationFrame(animate);
      stars.rotation.y += 0.0001;
      mana.rotation.y += 0.0005;
      mana.rotation.x += 0.0002;
      earth.rotation.y += 0.002;
      isekai.rotation.y -= 0.001;
      
      earth.position.y += Math.sin(Date.now() * 0.0005) * 0.01;
      isekai.position.y += Math.cos(Date.now() * 0.0004) * 0.015;

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, []);

  return <div ref={containerRef} className="fixed inset-0 z-0 pointer-events-none opacity-40" />;
};

export default SpaceBackground;
