/* registro-academico.js */

const SUPABASE_URL = "https://goxkmtnmfessroveanje.supabase.co";
const SUPABASE_KEY = "sb_publishable_w8xrtEanlJJAc5FYvk1X5A_fKu9vb5d";
const REGISTRO_ACADEMICO_FUNCTION_URL = SUPABASE_URL + "/functions/v1/clever-api";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let diplomasGlobal = [];

function mostrarError(texto){
  const div = document.getElementById("mensajeError");
  div.style.display = "block";
  div.innerText = texto;
  window.scrollTo({top:0, behavior:"smooth"});
}

function mostrarOk(texto){
  const div = document.getElementById("mensajeOk");
  div.style.display = "block";
  div.innerText = texto;
  window.scrollTo({top:0, behavior:"smooth"});
  setTimeout(()=>{ div.style.display = "none"; }, 4500);
}

function mostrarInfo(texto){
  const div = document.getElementById("mensajeInfo");
  div.style.display = "block";
  div.innerText = texto;
  window.scrollTo({top:0, behavior:"smooth"});
}

function limpiarMensajes(){
  ["mensajeError","mensajeOk","mensajeInfo"].forEach(id=>{
    const div = document.getElementById(id);
    if(div){
      div.style.display = "none";
      div.innerText = "";
    }
  });
}

function valor(id){
  const el = document.getElementById(id);
  return el ? String(el.value || "").trim() : "";
}

function setValor(id, v){
  const el = document.getElementById(id);
  if(el) el.value = v;
}

function limpiarTexto(valor){
  if(valor === null || valor === undefined || valor === "") return "-";
  return String(valor).replace(/</g,"&lt;").replace(/>/g,"&gt;");
}

function escapeHTML(texto){
  return limpiarTexto(texto);
}

function obtenerBase64DeDataUri(dataUri){
  return dataUri.split(",")[1];
}

function fechaInputHoy(){
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth()+1).padStart(2,"0");
  const dd = String(d.getDate()).padStart(2,"0");
  return `${yyyy}-${mm}-${dd}`;
}

function formatearFecha(fechaISO){
  if(!fechaISO) return "-";
  try{
    return new Date(fechaISO + "T00:00:00").toLocaleDateString("es-CL");
  }catch(e){
    return fechaISO;
  }
}

function normalizarArchivo(texto){
  return String(texto || "documento")
    .normalize("NFD").replace(/[\u0300-\u036f]/g,"")
    .replace(/[^a-zA-Z0-9-_]+/g,"-")
    .replace(/-+/g,"-")
    .replace(/^-|-$/g,"")
    .toLowerCase();
}

function generarRegistroInstitucional(){
  const year = new Date().getFullYear();
  const numero = String(Date.now()).slice(-6);
  return `IFCD-${year}-${numero}`;
}

function obtenerDatosFormulario(){
  const nombre_completo = valor("nombre_completo");
  const numero_identidad = valor("numero_identidad");
  const tipo_documento = valor("tipo_documento") || "Titulo Profesional";
  const descriptor_institucional = valor("descriptor_institucional");
  const programa = valor("programa");
  const titulo_otorgado = valor("titulo_otorgado");
  const fecha_emision = valor("fecha_emision") || fechaInputHoy();
  const cve = valor("cve");
  let registro_institucional = valor("registro_institucional");
  const firmado_por = valor("firmado_por") || "Representante y Director Academico";
  const observaciones = valor("observaciones");

  if(!registro_institucional){
    registro_institucional = generarRegistroInstitucional();
    setValor("registro_institucional", registro_institucional);
  }

  return {
    nombre_completo,
    numero_identidad,
    tipo_documento,
    descriptor_institucional,
    programa,
    titulo_otorgado,
    fecha_emision,
    cve,
    registro_institucional,
    firmado_por,
    observaciones
  };
}

function validarDatos(datos){
  if(!datos.nombre_completo) throw new Error("Debes ingresar el nombre completo.");
  if(!datos.numero_identidad) throw new Error("Debes ingresar RUT, DNI o pasaporte.");
  if(!datos.tipo_documento) throw new Error("Debes ingresar el tipo de documento.");
  if(!datos.programa) throw new Error("Debes ingresar la carrera, programa o curso.");
  if(!datos.titulo_otorgado) throw new Error("Debes ingresar el titulo, diploma o certificacion otorgada.");
  if(!datos.fecha_emision) throw new Error("Debes ingresar la fecha de emision.");
}

function previsualizarDatos(){
  limpiarMensajes();

  try{
    const d = obtenerDatosFormulario();
    validarDatos(d);

    const resultado = document.getElementById("resultado");
    resultado.style.display = "block";
    resultado.innerHTML = `
      <h3>Previsualizacion del documento</h3>
      <p><strong>Instituto de Formacion Clinica Delta</strong></p>
      <p>Confiere el presente:</p>
      <h2>${escapeHTML(d.tipo_documento)}</h2>
      <p><em>${escapeHTML(d.descriptor_institucional || "")}</em></p>
      <p>a</p>
      <h2>${escapeHTML(d.nombre_completo)}</h2>
      <p><strong>N. de identidad:</strong> ${escapeHTML(d.numero_identidad)}</p>
      <p>Por haber aprobado satisfactoriamente el programa:</p>
      <h3>${escapeHTML(d.programa)}</h3>
      <p>Otorgandole:</p>
      <h2>${escapeHTML(d.titulo_otorgado)}</h2>
      <p><strong>Fecha:</strong> ${escapeHTML(formatearFecha(d.fecha_emision))}</p>
      <p><strong>Registro Institucional:</strong> ${escapeHTML(d.registro_institucional)}</p>
      <p><strong>CVE:</strong> ${escapeHTML(d.cve || "-")}</p>
    `;
  }catch(error){
    mostrarError(error.message);
  }
}

function textoCentrado(doc, texto, y, fontSize, estilo="normal", color=[30,41,59]){
  doc.setFont("times", estilo);
  doc.setFontSize(fontSize);
  doc.setTextColor(color[0], color[1], color[2]);
  doc.text(String(texto || ""), 148.5, y, {align:"center"});
}

function generarPdfDiploma(datos){
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF("l", "mm", "a4");

  const pageW = 297;
  const pageH = 210;

  doc.setFillColor(248,245,239);
  doc.rect(0,0,pageW,pageH,"F");

  doc.setDrawColor(22,64,53);
  doc.setLineWidth(0.5);
  doc.rect(10,10,pageW-20,pageH-20);

  doc.setDrawColor(186,154,90);
  doc.setLineWidth(0.25);
  doc.rect(14,14,pageW-28,pageH-28);

  doc.setDrawColor(220,205,175);
  doc.setLineWidth(0.15);
  doc.rect(18,18,pageW-36,pageH-36);

  textoCentrado(doc, "INSTITUTO DE FORMACION CLINICA DELTA", 31, 14, "bold", [22,64,53]);
  textoCentrado(doc, "SCIENTIA  •  INTEGRITAS  •  HUMANITAS", 39, 8, "normal", [94,80,54]);

  doc.setDrawColor(22,64,53);
  doc.roundedRect(136.5, 46, 24, 30, 3, 3, "S");
  doc.setFont("times","bold");
  doc.setFontSize(18);
  doc.setTextColor(22,64,53);
  doc.text("Δ", 148.5, 60, {align:"center"});
  doc.setFontSize(9);
  doc.text("⚕", 148.5, 70, {align:"center"});

  textoCentrado(doc, "Confiere el presente", 86, 11, "normal", [70,70,70]);
  textoCentrado(doc, datos.tipo_documento.toUpperCase(), 101, 28, "bold", [22,64,53]);

  if(datos.descriptor_institucional){
    textoCentrado(doc, datos.descriptor_institucional, 111, 11, "italic", [94,80,54]);
  }

  textoCentrado(doc, "a", 124, 11, "normal", [70,70,70]);
  textoCentrado(doc, datos.nombre_completo, 138, 22, "bolditalic", [30,41,59]);
  textoCentrado(doc, "N. de identidad: " + datos.numero_identidad, 147, 10, "normal", [70,70,70]);

  textoCentrado(doc, "por haber aprobado satisfactoriamente el plan de estudios del programa:", 158, 10, "normal", [70,70,70]);
  textoCentrado(doc, datos.programa, 169, 16, "bold", [22,64,53]);

  textoCentrado(doc, "otorgandole el titulo de:", 179, 10, "normal", [70,70,70]);
  textoCentrado(doc, datos.titulo_otorgado.toUpperCase(), 192, 18, "bold", [22,64,53]);

  doc.setFont("helvetica","normal");
  doc.setFontSize(7);
  doc.setTextColor(90,90,90);

  const legal = "Este titulo corresponde a una certificacion otorgada por una institucion privada de formacion. No constituye un grado academico ni un titulo profesional oficial reconocido por el Estado de Chile. El ejercicio profesional se rige por la normativa sanitaria vigente, incluyendo los requisitos que establezca la autoridad competente.";
  const legalLines = doc.splitTextToSize(legal, 245);
  doc.text(legalLines, 26, 198);

  const pieY = 177;

  doc.setDrawColor(100,116,139);
  doc.line(32, pieY, 102, pieY);
  doc.setFont("helvetica","bold");
  doc.setFontSize(9);
  doc.setTextColor(30,41,59);
  doc.text(datos.firmado_por || "Representante y Director Academico", 67, pieY+6, {align:"center"});
  doc.setFont("helvetica","normal");
  doc.setFontSize(8);
  doc.text("Instituto de Formacion Clinica Delta", 67, pieY+11, {align:"center"});

  doc.setFont("helvetica","bold");
  doc.setFontSize(9);
  doc.text("Registro Academico Institucional", 230, pieY-3, {align:"center"});
  doc.setFont("helvetica","normal");
  doc.setFontSize(8);
  doc.text("Registro: " + datos.registro_institucional, 230, pieY+3, {align:"center"});
  doc.text("Fecha: " + formatearFecha(datos.fecha_emision), 230, pieY+8, {align:"center"});
  doc.text("Firmado electronicamente", 230, pieY+13, {align:"center"});
  doc.text("CVE: " + (datos.cve || "-"), 230, pieY+18, {align:"center"});

  doc.setTextColor(215,215,215);
  doc.setFont("times","bold");
  doc.setFontSize(52);
  doc.text("Δ", 260, 55, {align:"center"});
  doc.setFontSize(9);
  doc.text("SELLO INSTITUCIONAL", 260, 63, {align:"center"});

  return doc;
}

async function generarPdfBase64(datos){
  const doc = generarPdfDiploma(datos);
  const dataUri = doc.output("datauristring");
  const base64 = obtenerBase64DeDataUri(dataUri);

  const filename = `${normalizarArchivo(datos.tipo_documento)}-${normalizarArchivo(datos.nombre_completo)}-${Date.now()}.pdf`;

  return { doc, base64, filename };
}

async function enviarARegistroAcademico(datos, pdf){
  const payload = {
    nombre_completo: datos.nombre_completo,
    numero_identidad: datos.numero_identidad,
    tipo_documento: datos.tipo_documento,
    descriptor_institucional: datos.descriptor_institucional,
    programa: datos.programa,
    titulo_otorgado: datos.titulo_otorgado,
    fecha_emision: datos.fecha_emision,
    cve: datos.cve,
    registro_institucional: datos.registro_institucional,
    pdf_base64: pdf.base64,
    filename: pdf.filename,
    observaciones: datos.observaciones
  };

  const response = await fetch(REGISTRO_ACADEMICO_FUNCTION_URL, {
    method: "POST",
    headers: {
      "Content-Type":"application/json",
      "apikey": SUPABASE_KEY,
      "Authorization": "Bearer " + SUPABASE_KEY
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json().catch(()=>({}));

  if(!response.ok || !data.success){
    throw new Error(data.error || "No se pudo guardar el documento.");
  }

  return data;
}

async function generarYGuardarDocumento(){
  limpiarMensajes();

  try{
    mostrarInfo("Generando PDF y enviando al Registro Academico...");

    const datos = obtenerDatosFormulario();
    validarDatos(datos);

    const pdf = await generarPdfBase64(datos);
    const resultado = await enviarARegistroAcademico(datos, pdf);

    const div = document.getElementById("resultado");
    div.style.display = "block";
    div.innerHTML = `
      <h3>Documento emitido correctamente</h3>
      <p><strong>Nombre:</strong> ${escapeHTML(datos.nombre_completo)}</p>
      <p><strong>Documento:</strong> ${escapeHTML(datos.tipo_documento)}</p>
      <p><strong>Registro:</strong> ${escapeHTML(datos.registro_institucional)}</p>
      <p><strong>CVE:</strong> ${escapeHTML(datos.cve || "-")}</p>
      <p><a href="${resultado.pdf_url}" target="_blank">Abrir PDF generado</a></p>
    `;

    mostrarOk("Documento generado y guardado correctamente.");
    await cargarDiplomas();

  }catch(error){
    console.error(error);
    mostrarError("Error al generar documento: " + error.message);
  }
}

async function cargarDiplomas(){
  try{
    const tbody = document.querySelector("#tablaDiplomas tbody");
    tbody.innerHTML = `<tr><td colspan="10">Cargando documentos...</td></tr>`;

    const { data, error } = await supabaseClient
      .from("diplomas")
      .select("*")
      .order("created_at", { ascending:false });

    if(error) throw error;

    diplomasGlobal = data || [];
    pintarDiplomas(diplomasGlobal);

  }catch(error){
    console.error(error);
    const tbody = document.querySelector("#tablaDiplomas tbody");
    tbody.innerHTML = `<tr><td colspan="10">No se pudo cargar el historial: ${escapeHTML(error.message)}</td></tr>`;
  }
}

function pintarDiplomas(lista){
  const tbody = document.querySelector("#tablaDiplomas tbody");
  tbody.innerHTML = "";

  if(!lista || lista.length === 0){
    tbody.innerHTML = `<tr><td colspan="10">No hay documentos emitidos.</td></tr>`;
    return;
  }

  lista.forEach(d=>{
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${escapeHTML(d.fecha_emision || "-")}</td>
      <td>${escapeHTML(d.nombre_completo || "-")}</td>
      <td>${escapeHTML(d.numero_identidad || "-")}</td>
      <td>${escapeHTML(d.tipo_documento || "-")}</td>
      <td>${escapeHTML(d.programa || "-")}</td>
      <td>${escapeHTML(d.titulo_otorgado || "-")}</td>
      <td>${escapeHTML(d.cve || "-")}</td>
      <td>${escapeHTML(d.registro_institucional || "-")}</td>
      <td><span class="badge">${escapeHTML(d.estado || "Emitido")}</span></td>
      <td>${d.pdf_url ? `<a href="${d.pdf_url}" target="_blank">Abrir PDF</a>` : "-"}</td>
    `;
    tbody.appendChild(tr);
  });
}

function limpiarFormulario(){
  setValor("nombre_completo","");
  setValor("numero_identidad","");
  setValor("tipo_documento","Titulo Profesional");
  setValor("descriptor_institucional","Institucional Privado");
  setValor("programa","Medicina Naturopatica");
  setValor("titulo_otorgado","Naturopata");
  setValor("fecha_emision",fechaInputHoy());
  setValor("cve","");
  setValor("registro_institucional","");
  setValor("firmado_por","Representante y Director Academico");
  setValor("observaciones","");

  const resultado = document.getElementById("resultado");
  resultado.style.display = "none";
  resultado.innerHTML = "";

  limpiarMensajes();
}

document.addEventListener("DOMContentLoaded", async ()=>{
  if(!valor("fecha_emision")){
    setValor("fecha_emision", fechaInputHoy());
  }

  await cargarDiplomas();
});
