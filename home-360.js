/* Eternity Tech Consulting — immersive 360° Home experience
   Adds a Three.js globe to the existing Home page without replacing other pages. */
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js';

const HOME = document.querySelector('#home');
if (HOME && !HOME.dataset.home360Ready) {
  HOME.dataset.home360Ready = 'true';
  const hero = HOME.querySelector('.hero');
  const copy = HOME.querySelector('.hero-copy');
  const visual = HOME.querySelector('.hero-visual');

  if (hero && copy && visual) {
    hero.classList.add('hero-360');
    copy.querySelector('.eyebrow')?.insertAdjacentHTML('beforebegin', '<div class="home360-brandline"><span class="home360-brand-dot"></span> ETERNITY TECH CONSULTING <span class="home360-brand-divider">/</span> ENTERPRISE TECHNOLOGY</div>');
    const heading = copy.querySelector('h1');
    if (heading) heading.innerHTML = 'Engineering the digital core.<br><span>Powering the enterprise.</span>';
    const role = copy.querySelector('.hero-role');
    if (role) role.textContent = 'Kashif Raza · SAP BASIS Consultant · SAP HANA · S/4HANA';
    const intro = copy.querySelector('.hero-intro');
    if (intro) intro.textContent = 'Technical operations across SAP system administration, HANA database management, upgrades, monitoring and enterprise infrastructure — across private-cloud and on-premise environments.';
    const actions = copy.querySelector('.hero-actions');
    if (actions) {
      const buttons = [...actions.querySelectorAll('button')];
      if (buttons[0]) { buttons[0].innerHTML = 'Explore SAP ecosystem <span>↗</span>'; buttons[0].setAttribute('aria-label', 'Explore the interactive SAP technology ecosystem'); buttons[0].onclick = () => document.querySelector('#home360-ecosystem')?.scrollIntoView({behavior:'smooth'}); }
      if (buttons[1]) { buttons[1].textContent = 'View projects'; buttons[1].onclick = () => window.showPage ? window.showPage('portfolio') : document.querySelector('#home .project-grid')?.scrollIntoView({behavior:'smooth'}); }
      if (buttons[2]) { buttons[2].textContent = 'Connect with me'; buttons[2].onclick = () => window.showPage ? window.showPage('contact') : null; }
    }
    const meta = copy.querySelector('.hero-meta');
    if (meta) meta.innerHTML = '<span>Based in India</span><i></i><span>SAP technical operations</span><i></i><span>Open to opportunities</span>';

    visual.className = 'hero-visual hero-360-visual';
    visual.setAttribute('aria-label', 'Interactive 3D technology globe. Drag to rotate and select a technology.');
    visual.innerHTML = `
      <div class="globe-stage" id="home360-stage">
        <div class="globe-aura"></div>
        <div class="globe-canvas-wrap" id="home360-canvas"></div>
        <div class="globe-top-label"><span class="globe-live-dot"></span> INTERACTIVE TECHNOLOGY ORBIT <span>360°</span></div>
        <div class="globe-hint"><span>↔</span> DRAG TO ROTATE <i></i> SELECT A NODE</div>
        <div class="globe-node-label label-basis">SAP BASIS</div>
        <div class="globe-node-label label-hana">HANA</div>
        <div class="globe-node-label label-cloud">CLOUD</div>
        <div class="globe-node-label label-linux">LINUX</div>
      </div>`;
    const stage = visual.querySelector('#home360-stage');
    const canvasHost = visual.querySelector('#home360-canvas');

    const technology = [
      {id:'basis',name:'SAP BASIS',tag:'SYSTEM ADMINISTRATION',desc:'SAP system administration, transports, client administration, background jobs, monitoring and technical troubleshooting.',tools:'SAP GUI · STMS · SUM · Kernel Upgrade'},
      {id:'hana',name:'SAP HANA',tag:'DATABASE TECHNOLOGY',desc:'HANA database operations, health checks, performance review, backup awareness and System Replication activities.',tools:'HANA Cockpit · HANA Studio · SQL · HSR'},
      {id:'s4',name:'S/4HANA',tag:'ENTERPRISE APPLICATIONS',desc:'Technical administration and participation in S/4HANA upgrade and landscape activities.',tools:'S/4HANA · SUM · SPAM/SAINT'},
      {id:'cloud',name:'CLOUD INFRASTRUCTURE',tag:'PLATFORM OPERATIONS',desc:'SAP environments across Azure virtual machines, VMware private-cloud infrastructure and on-premise systems.',tools:'Azure VMs · VMware · Networking'},
      {id:'linux',name:'LINUX',tag:'OPERATING SYSTEMS',desc:'SAP-related operating-system operations and coordination across SUSE Linux and other infrastructure environments.',tools:'SUSE Linux · SSH · PuTTY · WinSCP'},
      {id:'ha',name:'HA / DISASTER RECOVERY',tag:'RESILIENCE',desc:'Exposure to HANA System Replication, high-availability concepts and disaster-recovery application landscapes.',tools:'HANA SR · DR · Replication'}
    ];

    const info = document.createElement('div');
    info.className = 'home360-node-panel';
    info.setAttribute('aria-live','polite');
    info.innerHTML = '<div class="node-panel-kicker">SELECT A TECHNOLOGY NODE</div><h3>Explore the SAP ecosystem</h3><p>Choose a node on the globe or use the technology shortcuts below.</p><div class="node-panel-tools">INTERACTIVE · 360°</div>';
    stage.append(info);

    const shortcuts = document.createElement('div');
    shortcuts.className = 'home360-shortcuts';
    technology.forEach((item, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'home360-shortcut';
      button.textContent = item.name;
      button.addEventListener('click', () => selectTechnology(index, true));
      shortcuts.append(button);
    });
    visual.append(shortcuts);

    function selectTechnology(index, focusNode = false) {
      const item = technology[index];
      info.innerHTML = `<div class="node-panel-kicker">${item.tag}</div><h3>${item.name}</h3><p>${item.desc}</p><div class="node-panel-tools">${item.tools}</div>`;
      shortcuts.querySelectorAll('button').forEach((button, i) => button.classList.toggle('is-selected', i === index));
      if (focusNode && nodeMeshes[index]) {
        const target = nodeMeshes[index].position.clone().normalize();
        const desiredY = Math.atan2(target.x, target.z);
        globeGroup.rotation.y += desiredY - globeGroup.rotation.y;
      }
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
    camera.position.set(0, 0, 4.6);
    const renderer = new THREE.WebGLRenderer({antialias:true, alpha:true, powerPreference:'high-performance'});
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.8));
    renderer.setClearColor(0x000000, 0);
    canvasHost.append(renderer.domElement);

    scene.add(new THREE.AmbientLight(0x8eb9e8, 1.8));
    const keyLight = new THREE.PointLight(0x56cfff, 30, 12); keyLight.position.set(3,2,4); scene.add(keyLight);
    const rimLight = new THREE.PointLight(0x365cff, 24, 10); rimLight.position.set(-3,-1,-3); scene.add(rimLight);

    const globeGroup = new THREE.Group(); scene.add(globeGroup);
    const globeGeometry = new THREE.SphereGeometry(1, 72, 56);
    const globeMaterial = new THREE.MeshPhongMaterial({color:0x0b3159, emissive:0x061b36, shininess:28, specular:0x5ebfff, transparent:true, opacity:0.96});
    const globe = new THREE.Mesh(globeGeometry, globeMaterial); globeGroup.add(globe);

    // Procedural latitude/longitude network lines.
    const lineMaterial = new THREE.LineBasicMaterial({color:0x39bfff, transparent:true, opacity:0.24});
    for (let lat=-75; lat<=75; lat+=15) {
      const points=[]; const phi=THREE.MathUtils.degToRad(90-lat);
      for(let j=0;j<=128;j++){const t=j/128*Math.PI*2;points.push(new THREE.Vector3(1.006*Math.sin(phi)*Math.cos(t),1.006*Math.cos(phi),1.006*Math.sin(phi)*Math.sin(t)));}
      globeGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),lineMaterial));
    }
    for (let lon=0; lon<180; lon+=15) {
      const points=[]; const theta=THREE.MathUtils.degToRad(lon);
      for(let j=0;j<=128;j++){const p=-Math.PI/2+j/128*Math.PI;points.push(new THREE.Vector3(1.006*Math.cos(p)*Math.sin(theta),1.006*Math.sin(p),1.006*Math.cos(p)*Math.cos(theta)));}
      globeGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),lineMaterial));
    }

    // Soft atmospheric shell.
    const shell = new THREE.Mesh(new THREE.SphereGeometry(1.055,48,36), new THREE.MeshBasicMaterial({color:0x168dff,transparent:true,opacity:0.075,side:THREE.BackSide}));
    globeGroup.add(shell);

    // Orbital rings.
    const orbitMaterial = new THREE.MeshBasicMaterial({color:0x39bfff,transparent:true,opacity:0.42,side:THREE.DoubleSide});
    const orbit1 = new THREE.Mesh(new THREE.TorusGeometry(1.36,0.0035,8,180),orbitMaterial); orbit1.rotation.x=1.12; orbit1.rotation.y=.32; globeGroup.add(orbit1);
    const orbit2 = new THREE.Mesh(new THREE.TorusGeometry(1.48,0.0025,8,180),new THREE.MeshBasicMaterial({color:0x637dff,transparent:true,opacity:0.32})); orbit2.rotation.x=.36; orbit2.rotation.y=1.05; globeGroup.add(orbit2);

    const nodeMeshes=[];
    const coords=[[-18,25],[35,12],[4,-30],[-42,4],[62,-25],[20,58]];
    technology.forEach((item,i)=>{
      const [lat,lon]=coords[i]; const phi=THREE.MathUtils.degToRad(90-lat); const theta=THREE.MathUtils.degToRad(lon);
      const position=new THREE.Vector3(Math.sin(phi)*Math.sin(theta),Math.cos(phi),Math.sin(phi)*Math.cos(theta)).multiplyScalar(1.035);
      const node=new THREE.Mesh(new THREE.SphereGeometry(.035,16,16),new THREE.MeshBasicMaterial({color:i===0?0x83edff:0x4bbcff}));
      node.position.copy(position); node.userData.index=i; globeGroup.add(node); nodeMeshes.push(node);
      const halo=new THREE.Mesh(new THREE.SphereGeometry(.07,16,16),new THREE.MeshBasicMaterial({color:0x39bfff,transparent:true,opacity:.12})); halo.position.copy(position); globeGroup.add(halo);
    });

    // Tiny stars around the globe.
    const starPositions=[];
    for(let i=0;i<420;i++){const r=2.0+Math.random()*2.6;const a=Math.random()*Math.PI*2;const z=Math.random()*2-1;const q=Math.sqrt(1-z*z);starPositions.push(r*q*Math.cos(a),r*z,r*q*Math.sin(a));}
    const starGeometry=new THREE.BufferGeometry(); starGeometry.setAttribute('position',new THREE.Float32BufferAttribute(starPositions,3));
    scene.add(new THREE.Points(starGeometry,new THREE.PointsMaterial({color:0x9bdfff,size:.012,transparent:true,opacity:.62})));

    const raycaster=new THREE.Raycaster(); const pointer=new THREE.Vector2();
    let dragging=false, moved=false, lastX=0,lastY=0,downX=0,downY=0,autoRotate=true,frame=0;
    renderer.domElement.addEventListener('pointerdown',e=>{dragging=true;moved=false;lastX=e.clientX;lastY=e.clientY;downX=e.clientX;downY=e.clientY;autoRotate=false;renderer.domElement.setPointerCapture(e.pointerId);});
    renderer.domElement.addEventListener('pointermove',e=>{if(!dragging)return;const dx=e.clientX-lastX,dy=e.clientY-lastY;if(Math.abs(e.clientX-downX)+Math.abs(e.clientY-downY)>4)moved=true;globeGroup.rotation.y+=dx*.006;globeGroup.rotation.x=Math.max(-.65,Math.min(.65,globeGroup.rotation.x+dy*.004));lastX=e.clientX;lastY=e.clientY;});
    renderer.domElement.addEventListener('pointerup',e=>{if(!dragging)return;dragging=false;try{renderer.domElement.releasePointerCapture(e.pointerId);}catch{} if(!moved){const rect=renderer.domElement.getBoundingClientRect();pointer.x=((e.clientX-rect.left)/rect.width)*2-1;pointer.y=-((e.clientY-rect.top)/rect.height)*2+1;raycaster.setFromCamera(pointer,camera);const hits=raycaster.intersectObjects(nodeMeshes);if(hits.length)selectTechnology(hits[0].object.userData.index);}window.setTimeout(()=>{autoRotate=true;},1200);});
    renderer.domElement.addEventListener('pointercancel',()=>{dragging=false;autoRotate=true;});

    function resize(){const w=Math.max(1,canvasHost.clientWidth);const h=Math.max(1,canvasHost.clientHeight);renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();}
    const resizeObserver=new ResizeObserver(resize); resizeObserver.observe(canvasHost); resize();
    const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    function animate(){frame=requestAnimationFrame(animate);if(document.hidden)return;if(autoRotate&&!dragging&&!reducedMotion)globeGroup.rotation.y+=.0018;orbit1.rotation.z+=.0007;orbit2.rotation.z-=.00045;renderer.render(scene,camera);}
    animate();
    window.addEventListener('pagehide',()=>{cancelAnimationFrame(frame);resizeObserver.disconnect();renderer.dispose();globeGeometry.dispose();globeMaterial.dispose();},{once:true});
    selectTechnology(0);

    // Add an accessible technology ecosystem section immediately after the hero.
    if (!HOME.querySelector('#home360-ecosystem')) {
      const ecosystem=document.createElement('section'); ecosystem.id='home360-ecosystem'; ecosystem.className='home360-ecosystem';
      ecosystem.innerHTML=`<div class="home360-section-head"><div><span class="home360-section-kicker">EXPLORE THE TECHNOLOGY UNIVERSE</span><h2>One ecosystem. <span>Connected technologies.</span></h2></div><p>Explore the technical layers that support reliable SAP landscapes — from application administration to database and infrastructure operations.</p></div><div class="home360-ecosystem-grid"><div class="home360-orbit-mini"><div class="mini-orbit mini-orbit-a"></div><div class="mini-orbit mini-orbit-b"></div><div class="mini-core">SAP<br><b>CORE</b></div><span class="mini-node mini-node-1">BASIS</span><span class="mini-node mini-node-2">HANA</span><span class="mini-node mini-node-3">CLOUD</span><span class="mini-node mini-node-4">LINUX</span></div><div class="home360-tech-list">${technology.map((item,i)=>`<button class="home360-tech-row" type="button" data-tech-index="${i}"><span class="home360-tech-number">0${i+1}</span><span><b>${item.name}</b><small>${item.tag}</small></span><span class="home360-tech-arrow">↗</span></button>`).join('')}</div></div>`;
      hero.insertAdjacentElement('afterend',ecosystem);
      ecosystem.querySelectorAll('[data-tech-index]').forEach(button=>button.addEventListener('click',()=>{selectTechnology(Number(button.dataset.techIndex),true);visual.scrollIntoView({behavior:'smooth',block:'center'});}));
    }

    // Add a simple infrastructure architecture explainer after existing project highlights.
    if (!HOME.querySelector('#home360-architecture')) {
      const projectGrid=HOME.querySelector('.project-grid');
      const projectSection=projectGrid?.closest('.section-block');
      const architecture=document.createElement('section'); architecture.id='home360-architecture'; architecture.className='home360-architecture section-block';
      architecture.innerHTML=`<div class="home360-section-head"><div><span class="home360-section-kicker">BEHIND THE LANDSCAPE</span><h2>How the SAP landscape <span>connects.</span></h2></div><p>A simplified view of the infrastructure layers involved in delivering dependable enterprise applications.</p></div><div class="home360-arch-flow"><div class="home360-arch-layer"><span>01</span><div><b>Users &amp; Access</b><small>Business users · SAP GUI · Fiori</small></div><i>↕</i></div><div class="home360-arch-layer"><span>02</span><div><b>SAP Application Layer</b><small>Application servers · Instances · Services</small></div><i>↕</i></div><div class="home360-arch-layer"><span>03</span><div><b>SAP HANA Database</b><small>Database operations · Monitoring · Backup</small></div><i>↕</i></div><div class="home360-arch-layer"><span>04</span><div><b>Infrastructure &amp; Resilience</b><small>Linux · Cloud / VMware · HA / DR</small></div><i>✓</i></div></div><p class="home360-arch-note">Conceptual architecture for learning and portfolio presentation; actual customer landscapes vary.</p>`;
      if(projectSection) projectSection.insertAdjacentElement('afterend',architecture);
      else HOME.append(architecture);
    }
  }
}
