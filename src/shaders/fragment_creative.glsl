precision highp float;

in vec3 v_normal;
in vec3 v_positionWorld;

out vec4 fragColor;

uniform vec3 cameraPosition;
uniform vec3 u_lightDirection;
uniform vec3 u_lightColor;
uniform vec3 u_objectColor;

void main() {
    vec3 normal = normalize(v_normal);
    vec3 lightDir = normalize(u_lightDirection);

    // Toon shading: define niveles de iluminación
    float brightness = max(dot(normal, lightDir), 0.0);
    float step1 = step(0.2, brightness);
    float step2 = step(0.5, brightness);
    float step3 = step(0.8, brightness);

    vec3 toonColor = mix(u_objectColor * 0.2, u_objectColor * 0.5, step1);
    toonColor = mix(toonColor, u_objectColor * 0.8, step2);
    toonColor = mix(toonColor, u_objectColor, step3);

    fragColor = vec4(toonColor, 1.0);
}
