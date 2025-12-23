export interface CarPart {
    id: string;
    name: string;
    views: string[]; // Which views this part appears in
}

export const CAR_PARTS: CarPart[] = [
    // Front parts
    { id: 'front-bumper', name: 'Front Bumper', views: ['front', 'top'] },
    { id: 'hood', name: 'Hood', views: ['front', 'top'] },
    { id: 'windshield', name: 'Windshield', views: ['front', 'top'] },
    { id: 'left-headlight', name: 'Left Headlight', views: ['front'] },
    { id: 'right-headlight', name: 'Right Headlight', views: ['front'] },
    { id: 'grille', name: 'Front Grille', views: ['front'] },

    // Side parts
    { id: 'left-front-door', name: 'Left Front Door', views: ['left', 'top'] },
    { id: 'left-rear-door', name: 'Left Rear Door', views: ['left', 'top'] },
    { id: 'right-front-door', name: 'Right Front Door', views: ['right', 'top'] },
    { id: 'right-rear-door', name: 'Right Rear Door', views: ['right', 'top'] },
    { id: 'left-front-fender', name: 'Left Front Fender', views: ['left', 'front', 'top'] },
    { id: 'left-rear-fender', name: 'Left Rear Fender', views: ['left', 'rear', 'top'] },
    { id: 'right-front-fender', name: 'Right Front Fender', views: ['right', 'front', 'top'] },
    { id: 'right-rear-fender', name: 'Right Rear Fender', views: ['right', 'rear', 'top'] },
    { id: 'left-mirror', name: 'Left Side Mirror', views: ['left', 'front', 'top'] },
    { id: 'right-mirror', name: 'Right Side Mirror', views: ['right', 'front', 'top'] },

    // Rear parts
    { id: 'rear-bumper', name: 'Rear Bumper', views: ['rear', 'top'] },
    { id: 'trunk', name: 'Trunk/Tailgate', views: ['rear', 'top'] },
    { id: 'rear-windshield', name: 'Rear Windshield', views: ['rear', 'top'] },
    { id: 'left-taillight', name: 'Left Taillight', views: ['rear'] },
    { id: 'right-taillight', name: 'Right Taillight', views: ['rear'] },

    // Top/Roof
    { id: 'roof', name: 'Roof', views: ['top', 'left', 'right'] },

    // Wheels
    { id: 'left-front-wheel', name: 'Left Front Wheel', views: ['left', 'front'] },
    { id: 'left-rear-wheel', name: 'Left Rear Wheel', views: ['left', 'rear'] },
    { id: 'right-front-wheel', name: 'Right Front Wheel', views: ['right', 'front'] },
    { id: 'right-rear-wheel', name: 'Right Rear Wheel', views: ['right', 'rear'] },

    // Interior
    { id: 'dashboard', name: 'Dashboard', views: ['interior'] },
    { id: 'steering', name: 'Steering Wheel', views: ['interior'] },
    { id: 'front-seats', name: 'Front Seats', views: ['interior'] },
    { id: 'rear-seats', name: 'Rear Seats', views: ['interior'] },
    { id: 'center-console', name: 'Center Console', views: ['interior'] },
];
