#!/usr/bin/env node

import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import {
  access,
  copyFile,
  cp,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const emailsRoot = path.join(repoRoot, "emails");
const deliveriesRoot = path.join(emailsRoot, "deliveries");
const universitiesRoot = path.join(emailsRoot, "_universities");
const startersRoot = path.join(emailsRoot, "_shared", "starters");
const catalogPath = path.join(repoRoot, "catalog", "email-index.generated.json");
const emailBinary = path.join(
  repoRoot,
  "node_modules",
  ".bin",
  process.platform === "win32" ? "email.cmd" : "email",
);

function parseArgs(tokens) {
  const options = {};
  const positionals = [];

  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    if (!token.startsWith("--")) {
      positionals.push(token);
      continue;
    }

    const withoutPrefix = token.slice(2);
    const separatorIndex = withoutPrefix.indexOf("=");
    if (separatorIndex >= 0) {
      options[withoutPrefix.slice(0, separatorIndex)] = withoutPrefix.slice(separatorIndex + 1);
      continue;
    }

    const nextToken = tokens[index + 1];
    if (nextToken && !nextToken.startsWith("--")) {
      options[withoutPrefix] = nextToken;
      index += 1;
    } else {
      options[withoutPrefix] = true;
    }
  }

  return { options, positionals };
}

async function exists(targetPath) {
  try {
    await access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function readJson(targetPath) {
  return JSON.parse(await readFile(targetPath, "utf8"));
}

async function writeJson(targetPath, value) {
  await mkdir(path.dirname(targetPath), { recursive: true });
  await writeFile(targetPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function findFiles(directory, filename) {
  if (!(await exists(directory))) return [];

  const matches = [];
  const entries = await readdir(directory, { withFileTypes: true });
  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      matches.push(...(await findFiles(entryPath, filename)));
    } else if (entry.name === filename) {
      matches.push(entryPath);
    }
  }
  return matches;
}

async function collectFiles(directory, filter = () => true) {
  if (!(await exists(directory))) return [];
  const files = [];
  const entries = await readdir(directory, { withFileTypes: true });
  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
    const entryPath = path.join(directory, entry.name);
    if (!filter(entryPath)) continue;
    if (entry.isDirectory()) files.push(...(await collectFiles(entryPath, filter)));
    if (entry.isFile()) files.push(entryPath);
  }
  return files;
}

async function loadRecords() {
  const manifestPaths = await findFiles(deliveriesRoot, "version.json");
  return Promise.all(
    manifestPaths.map(async (manifestPath) => {
      const versionDir = path.dirname(manifestPath);
      const manifest = await readJson(manifestPath);
      const emailManifestPath = path.resolve(versionDir, "..", "..", "email.json");
      const campaignManifestPath = path.resolve(versionDir, "..", "..", "..", "..", "campaign.json");
      const email = (await exists(emailManifestPath)) ? await readJson(emailManifestPath) : null;
      const campaign = (await exists(campaignManifestPath))
        ? await readJson(campaignManifestPath)
        : null;

      return {
        manifest,
        manifestPath,
        versionDir,
        sourcePath: path.join(versionDir, manifest.source ?? "email.jsx"),
        artifactPath: path.join(versionDir, manifest.output ?? "artifacts/email.html"),
        email,
        emailManifestPath,
        campaign,
        campaignManifestPath,
      };
    }),
  );
}

function versionNumber(version) {
  const match = /^v(\d+)$/.exec(version ?? "");
  return match ? Number(match[1]) : -1;
}

function recordSpec(record) {
  return `${record.manifest.emailId}@${record.manifest.version}`;
}

function resolveRecord(records, spec) {
  if (!spec) {
    if (records.length === 1) return records[0];
    throw new Error(
      "Indica una versión como <email-id>@vNNN. Usa `npm run email:list` para consultarlas.",
    );
  }

  const exactMatches = records.filter(
    (record) =>
      record.manifest.deliveryId === spec ||
      recordSpec(record) === spec ||
      `${record.manifest.emailId}/${record.manifest.version}` === spec,
  );
  if (exactMatches.length === 1) return exactMatches[0];

  const emailMatches = records
    .filter((record) => record.manifest.emailId === spec)
    .sort((left, right) => versionNumber(right.manifest.version) - versionNumber(left.manifest.version));
  if (emailMatches.length === 1) return emailMatches[0];
  if (emailMatches.length > 1) {
    throw new Error(
      `${spec} tiene varias versiones. Indica una explícitamente, por ejemplo ${recordSpec(emailMatches[0])}.`,
    );
  }

  throw new Error(`No se encontró la entrega ${spec}.`);
}

function sha256(contents) {
  return createHash("sha256").update(contents).digest("hex");
}

function inspectRenderedHtml(htmlText) {
  const errors = [];
  const warnings = [];
  for (const match of htmlText.matchAll(/href=["']([^"']*)["']/gi)) {
    const href = match[1].trim();
    if (!href) errors.push("El HTML contiene un href vacío.");
    if (/^javascript:/i.test(href)) errors.push(`Enlace inseguro: ${href}`);
    if (/example\.com/i.test(href)) errors.push(`Enlace provisional: ${href}`);
    if (/^http:\/\//i.test(href)) warnings.push(`Enlace sin HTTPS: ${href}`);
  }
  return { errors, warnings };
}

async function buildInputSha256(record) {
  const { manifest } = record;
  const kitPath = path.join(emailsRoot, "_shared", "kits", manifest.kitRevision);
  const layoutPath = path.join(
    emailsRoot,
    "_shared",
    "layouts",
    `${manifest.layoutRevision}.jsx`,
  );
  const [brandUniversity, brandVersion] = String(manifest.brandRevision).split("/");
  const brandPath = path.join(universitiesRoot, brandUniversity, "brand", brandVersion);
  const versionFiles = await collectFiles(record.versionDir, (targetPath) => {
    const localPath = path.relative(record.versionDir, targetPath);
    return (
      localPath !== "version.json" &&
      localPath !== "artifacts" &&
      !localPath.startsWith(`artifacts${path.sep}`)
    );
  });
  const dependencyFiles = [
    ...(await collectFiles(kitPath)),
    ...((await exists(layoutPath)) ? [layoutPath] : []),
    ...(await collectFiles(brandPath)),
  ];
  const files = [...new Set([...versionFiles, ...dependencyFiles])].sort();
  const hash = createHash("sha256");
  hash.update(
    JSON.stringify({
      subject: manifest.subject,
      preheader: manifest.preheader,
      kitRevision: manifest.kitRevision,
      layoutRevision: manifest.layoutRevision,
      brandRevision: manifest.brandRevision,
    }),
  );
  for (const targetPath of files) {
    hash.update("\0");
    hash.update(relative(targetPath));
    hash.update("\0");
    hash.update(await readFile(targetPath));
  }
  return hash.digest("hex");
}

function slugify(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function isoDate() {
  return new Date().toISOString().slice(0, 10);
}

function relative(targetPath) {
  return path.relative(repoRoot, targetPath).split(path.sep).join("/");
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: options.capture ? "pipe" : "inherit",
  });

  if (result.error) throw result.error;
  return result;
}

function runEmail(args) {
  if (!path.isAbsolute(emailBinary)) throw new Error("No se pudo resolver React Email.");
  const result = run(emailBinary, args);
  if (result.status !== 0) {
    throw new Error(`React Email terminó con código ${result.status}.`);
  }
}

async function validateRecord(
  record,
  { verifyArtifact = true, verifyInput = true } = {},
) {
  const errors = [];
  const warnings = [];
  const { manifest } = record;
  const requiredStrings = [
    "deliveryId",
    "emailId",
    "version",
    "university",
    "campaignId",
    "kitRevision",
    "layoutRevision",
    "brandRevision",
    "subject",
    "preheader",
    "status",
    "source",
    "output",
  ];

  for (const key of requiredStrings) {
    if (typeof manifest[key] !== "string" || manifest[key].trim() === "") {
      errors.push(`${key} es obligatorio.`);
    }
  }

  if (!/^v\d{3,}$/.test(manifest.version ?? "")) {
    errors.push("version debe usar el formato v001, v002, etc.");
  }

  if (manifest.deliveryId !== `${manifest.emailId}-${manifest.version}`) {
    errors.push("deliveryId debe ser <emailId>-<version>.");
  }

  if (path.basename(record.versionDir) !== manifest.version) {
    errors.push("El nombre de la carpeta no coincide con version.");
  }

  if (record.email && record.email.emailId !== manifest.emailId) {
    errors.push("email.json y version.json tienen emailId diferentes.");
  }
  if (!record.email) {
    errors.push("No existe email.json para esta versión.");
  }
  if (record.campaign && record.campaign.campaignId !== manifest.campaignId) {
    errors.push("campaign.json y version.json tienen campaignId diferentes.");
  }
  if (!record.campaign) {
    errors.push("No existe campaign.json para esta versión.");
  }
  if (!/^[a-z0-9]+-eml-\d{4}-\d{3}-\d{2}$/.test(manifest.emailId ?? "")) {
    errors.push("emailId no cumple el formato <prefijo>-eml-AAAA-NNN-NN.");
  }
  if (!/^[a-z0-9]+-cmp-\d{4}-\d{3}$/.test(manifest.campaignId ?? "")) {
    errors.push("campaignId no cumple el formato <prefijo>-cmp-AAAA-NNN.");
  }
  if (record.email && record.email.campaignId !== manifest.campaignId) {
    errors.push("email.json pertenece a otra campaña.");
  }
  if (record.email && record.email.university !== manifest.university) {
    errors.push("email.json pertenece a otra universidad.");
  }
  if (record.campaign && record.campaign.university !== manifest.university) {
    errors.push("campaign.json pertenece a otra universidad.");
  }

  if (!(await exists(record.sourcePath))) {
    errors.push(`No existe ${relative(record.sourcePath)}.`);
  }

  const kitPath = path.join(emailsRoot, "_shared", "kits", manifest.kitRevision ?? "");
  if (!(await exists(kitPath))) errors.push(`No existe el kit ${manifest.kitRevision}.`);

  const layoutPath = path.join(
    emailsRoot,
    "_shared",
    "layouts",
    `${manifest.layoutRevision ?? ""}.jsx`,
  );
  if (!(await exists(layoutPath))) {
    errors.push(`No existe el layout ${manifest.layoutRevision}.`);
  }

  const [brandUniversity, brandVersion] = String(manifest.brandRevision ?? "").split("/");
  const brandPath = path.join(
    universitiesRoot,
    brandUniversity ?? "",
    "brand",
    brandVersion ?? "",
    "theme.js",
  );
  if (!(await exists(brandPath))) {
    errors.push(`No existe la marca ${manifest.brandRevision}.`);
  }

  if (!["draft", "delivered"].includes(manifest.status)) {
    errors.push("status debe ser draft o delivered.");
  }
  if (manifest.status === "delivered" && !manifest.releasedAt) {
    errors.push("Una versión delivered debe incluir releasedAt.");
  }
  if (manifest.status === "delivered" && !manifest.outputSha256) {
    errors.push("Una versión delivered debe incluir outputSha256.");
  }
  if (manifest.status === "delivered" && !manifest.inputSha256) {
    errors.push("Una versión delivered debe incluir inputSha256.");
  }

  if (verifyArtifact && manifest.outputSha256) {
    if (!(await exists(record.artifactPath))) {
      errors.push("El manifiesto declara un checksum, pero no existe el HTML final.");
    } else {
      const html = await readFile(record.artifactPath);
      const currentHash = sha256(html);
      if (currentHash !== manifest.outputSha256) {
        errors.push("El checksum del HTML no coincide con version.json.");
      }

      const htmlInspection = inspectRenderedHtml(html.toString("utf8"));
      errors.push(...htmlInspection.errors);
      warnings.push(...htmlInspection.warnings);
    }
  }

  if (verifyInput && manifest.inputSha256) {
    const currentInputHash = await buildInputSha256(record);
    if (currentInputHash !== manifest.inputSha256) {
      const message = "La fuente o una revisión compartida cambió desde la última exportación.";
      if (manifest.status === "delivered") errors.push(message);
      else warnings.push(`${message} Vuelve a exportar el borrador.`);
    }
  }

  return { errors, warnings };
}

async function writeCatalog(records) {
  const sourceRecords = records ?? (await loadRecords());
  const entries = sourceRecords
    .map((record) => ({
      deliveryId: record.manifest.deliveryId,
      emailId: record.manifest.emailId,
      version: record.manifest.version,
      university: record.manifest.university,
      campaignId: record.manifest.campaignId,
      campaign: record.campaign?.name ?? null,
      email: record.email?.name ?? null,
      subject: record.manifest.subject,
      status: record.manifest.status,
      source: relative(record.sourcePath),
      output: relative(record.artifactPath),
      releasedAt: record.manifest.releasedAt,
    }))
    .sort((left, right) => left.deliveryId.localeCompare(right.deliveryId));

  await writeJson(catalogPath, {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    total: entries.length,
    entries,
  });
  return entries;
}

async function commandList() {
  const records = await loadRecords();
  if (records.length === 0) {
    console.log("No hay entregas registradas.");
    return;
  }

  console.table(
    records
      .sort((left, right) => recordSpec(left).localeCompare(recordSpec(right)))
      .map((record) => ({
        entrega: recordSpec(record),
        universidad: record.manifest.university,
        campaña: record.campaign?.name ?? record.manifest.campaignId,
        correo: record.email?.name ?? "",
        estado: record.manifest.status,
      })),
  );
}

async function commandCatalog() {
  const entries = await writeCatalog();
  console.log(`Catálogo actualizado: ${relative(catalogPath)} (${entries.length} versiones).`);
}

async function commandCompile() {
  const temporaryRoot = await mkdtemp(path.join(tmpdir(), "react-email-compile-"));
  const temporaryOutput = path.join(temporaryRoot, "out");
  try {
    runEmail([
      "export",
      "--dir",
      relative(emailsRoot),
      "--outDir",
      temporaryOutput,
      "--silent",
    ]);
    console.log("Compilación de plantillas completada correctamente.");
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true });
  }
}

async function commandCheck(spec, all) {
  const records = await loadRecords();
  const selected = all || !spec ? records : [resolveRecord(records, spec)];
  const duplicateDeliveryIds = new Set();
  const seenDeliveryIds = new Set();

  for (const record of records) {
    if (seenDeliveryIds.has(record.manifest.deliveryId)) {
      duplicateDeliveryIds.add(record.manifest.deliveryId);
    }
    seenDeliveryIds.add(record.manifest.deliveryId);
  }

  let errorCount = 0;
  let warningCount = 0;
  for (const record of selected) {
    const { errors, warnings } = await validateRecord(record);
    if (duplicateDeliveryIds.has(record.manifest.deliveryId)) {
      errors.push(`deliveryId duplicado: ${record.manifest.deliveryId}.`);
    }
    if (
      record.manifest.basedOn &&
      !records.some(
        (candidate) =>
          candidate.manifest.emailId === record.manifest.emailId &&
          candidate.manifest.version === record.manifest.basedOn,
      )
    ) {
      errors.push(`basedOn apunta a una versión inexistente: ${record.manifest.basedOn}.`);
    }

    console.log(`${recordSpec(record)}: ${errors.length ? "ERROR" : "OK"}`);
    for (const error of errors) console.error(`  error: ${error}`);
    for (const warning of warnings) console.warn(`  aviso: ${warning}`);
    errorCount += errors.length;
    warningCount += warnings.length;
  }

  console.log(
    `Validación terminada: ${selected.length} versiones, ${errorCount} errores, ${warningCount} avisos.`,
  );
  if (errorCount > 0) process.exitCode = 1;
}

async function commandDev(spec, port) {
  const record = resolveRecord(await loadRecords(), spec);
  const args = ["dev", "--dir", relative(record.versionDir)];
  if (port) args.push("--port", String(port));
  console.log(`Abriendo preview de ${recordSpec(record)} desde ${relative(record.versionDir)}.`);
  runEmail(args);
}

async function renderRecord(record, release) {
  const beforeRender = await validateRecord(record, {
    verifyArtifact: false,
    verifyInput: false,
  });
  if (beforeRender.errors.length) {
    throw new Error(
      `No se puede exportar ${recordSpec(record)}:\n- ${beforeRender.errors.join("\n- ")}`,
    );
  }
  if (release && record.manifest.status === "delivered") {
    throw new Error("La versión ya fue entregada y es inmutable. Crea una versión nueva.");
  }

  const temporaryRoot = await mkdtemp(path.join(tmpdir(), "react-email-export-"));
  const temporaryOutput = path.join(temporaryRoot, "out");
  try {
    runEmail([
      "export",
      "--dir",
      relative(record.versionDir),
      "--outDir",
      temporaryOutput,
      "--pretty",
    ]);

    const renderedPath = path.join(temporaryOutput, "email.html");
    if (!(await exists(renderedPath))) {
      throw new Error(`React Email no generó ${renderedPath}.`);
    }

    const renderedHtml = await readFile(renderedPath);
    const renderedHash = sha256(renderedHtml);
    const htmlInspection = inspectRenderedHtml(renderedHtml.toString("utf8"));
    if (htmlInspection.errors.length) {
      throw new Error(`El HTML contiene errores:\n- ${htmlInspection.errors.join("\n- ")}`);
    }
    for (const warning of htmlInspection.warnings) console.warn(`Aviso: ${warning}`);

    if (record.manifest.status === "delivered") {
      if (renderedHash !== record.manifest.outputSha256) {
        throw new Error(
          "La reconstrucción no coincide con el HTML entregado. Usa el tag histórico o crea una versión nueva.",
        );
      }
      console.log(`Entrega inmutable verificada: ${recordSpec(record)} (${renderedHash}).`);
      return;
    }

    const artifactDirectory = path.dirname(record.artifactPath);
    await mkdir(artifactDirectory, { recursive: true });
    await copyFile(renderedPath, record.artifactPath);

    const renderedStatic = path.join(temporaryOutput, "static");
    const artifactStatic = path.join(artifactDirectory, "static");
    await rm(artifactStatic, { recursive: true, force: true });
    if (await exists(renderedStatic)) {
      await cp(renderedStatic, artifactStatic, { recursive: true });
    }

    record.manifest.outputSha256 = renderedHash;
    record.manifest.inputSha256 = await buildInputSha256(record);
    record.manifest.generatedAt = new Date().toISOString();
    if (release) {
      record.manifest.status = "delivered";
      record.manifest.releasedAt = new Date().toISOString();
    }
    await writeJson(record.manifestPath, record.manifest);
    await writeCatalog();

    console.log(`HTML generado: ${relative(record.artifactPath)}`);
    console.log(`SHA-256: ${renderedHash}`);
    if (release) {
      const tag = `delivery/${record.manifest.university}/${record.manifest.emailId}/${record.manifest.version}`;
      console.log("La versión quedó congelada como delivered.");
      console.log(`Commit sugerido: release(email): ${record.manifest.deliveryId}`);
      console.log(`Tag sugerido: ${tag}`);
    }
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true });
  }
}

async function commandExport(spec, release = false) {
  const record = resolveRecord(await loadRecords(), spec);
  await renderRecord(record, release);
}

function nextCampaignId(prefix, year, campaignManifests) {
  const expression = new RegExp(`^${escapeRegExp(prefix)}-cmp-${year}-(\\d{3})$`);
  const highest = campaignManifests.reduce((current, campaign) => {
    const match = expression.exec(campaign.campaignId ?? "");
    return match ? Math.max(current, Number(match[1])) : current;
  }, 0);
  return `${prefix}-cmp-${year}-${String(highest + 1).padStart(3, "0")}`;
}

function nextEmailId(campaignId, emailManifests) {
  const base = campaignId.replace("-cmp-", "-eml-");
  const expression = new RegExp(`^${escapeRegExp(base)}-(\\d{2})$`);
  const highest = emailManifests.reduce((current, email) => {
    const match = expression.exec(email.emailId ?? "");
    return match ? Math.max(current, Number(match[1])) : current;
  }, 0);
  return `${base}-${String(highest + 1).padStart(2, "0")}`;
}

async function commandNewFromExisting(spec) {
  const records = await loadRecords();
  const source = resolveRecord(records, spec);
  const relatedVersions = records.filter(
    (record) => record.manifest.emailId === source.manifest.emailId,
  );
  const nextNumber =
    Math.max(...relatedVersions.map((record) => versionNumber(record.manifest.version))) + 1;
  const nextVersion = `v${String(nextNumber).padStart(3, "0")}`;
  const versionsDirectory = path.dirname(source.versionDir);
  const targetDirectory = path.join(versionsDirectory, nextVersion);

  if (await exists(targetDirectory)) throw new Error(`${relative(targetDirectory)} ya existe.`);
  await cp(source.versionDir, targetDirectory, {
    recursive: true,
    filter(sourcePath) {
      const localPath = path.relative(source.versionDir, sourcePath);
      return (
        localPath !== "version.json" &&
        localPath !== "artifacts" &&
        !localPath.startsWith(`artifacts${path.sep}`)
      );
    },
  });

  const nextManifest = {
    ...source.manifest,
    deliveryId: `${source.manifest.emailId}-${nextVersion}`,
    version: nextVersion,
    basedOn: source.manifest.version,
    status: "draft",
    createdAt: isoDate(),
    generatedAt: null,
    releasedAt: null,
    outputSha256: null,
    inputSha256: null,
  };
  await writeJson(path.join(targetDirectory, "version.json"), nextManifest);
  await writeCatalog();
  console.log(`Nueva versión: ${source.manifest.emailId}@${nextVersion}`);
  console.log(`Basada en: ${recordSpec(source)}`);
  console.log(`Ruta: ${relative(targetDirectory)}`);
}

async function commandNewFromTemplate(options) {
  const universityId = String(options.university ?? "").trim();
  const emailName = String(options["email-name"] ?? "").trim();
  const campaignName = String(options["campaign-name"] ?? "").trim();
  if (!universityId || !emailName) {
    throw new Error("--university y --email-name son obligatorios para un correo nuevo.");
  }

  const universityPath = path.join(universitiesRoot, universityId, "university.json");
  if (!(await exists(universityPath))) {
    throw new Error(`No existe la configuración de la universidad ${universityId}.`);
  }
  const university = await readJson(universityPath);
  const year = Number(options.year ?? new Date().getFullYear());
  if (!Number.isInteger(year)) throw new Error("--year debe ser un año válido.");

  const campaignPaths = await findFiles(deliveriesRoot, "campaign.json");
  const campaigns = await Promise.all(campaignPaths.map((targetPath) => readJson(targetPath)));
  let campaignId = options["campaign-id"] ? String(options["campaign-id"]) : null;
  let campaignPath = null;
  let campaign = null;

  if (campaignId) {
    const foundIndex = campaigns.findIndex((item) => item.campaignId === campaignId);
    if (foundIndex >= 0) {
      campaign = campaigns[foundIndex];
      campaignPath = campaignPaths[foundIndex];
      if (campaign.university !== universityId) {
        throw new Error(`${campaignId} pertenece a ${campaign.university}, no a ${universityId}.`);
      }
    }
  } else {
    campaignId = nextCampaignId(university.idPrefix, year, campaigns);
  }

  if (!campaign) {
    if (!campaignName) {
      throw new Error("--campaign-name es obligatorio cuando la campaña todavía no existe.");
    }
    const campaignDirectory = path.join(
      deliveriesRoot,
      universityId,
      String(year),
      `${campaignId}--${slugify(campaignName)}`,
    );
    campaignPath = path.join(campaignDirectory, "campaign.json");
    campaign = {
      schemaVersion: 1,
      campaignId,
      university: universityId,
      name: campaignName,
      year,
      createdAt: isoDate(),
    };
    await writeJson(campaignPath, campaign);
  }

  const campaignDirectory = path.dirname(campaignPath);
  const emailPaths = await findFiles(path.join(campaignDirectory, "messages"), "email.json");
  const emailManifests = await Promise.all(emailPaths.map((targetPath) => readJson(targetPath)));
  const emailId = options["email-id"]
    ? String(options["email-id"])
    : nextEmailId(campaignId, emailManifests);
  if (emailManifests.some((email) => email.emailId === emailId)) {
    throw new Error(`${emailId} ya existe. Usa --from para crear una versión.`);
  }

  const emailDirectory = path.join(
    campaignDirectory,
    "messages",
    `${emailId}--${slugify(emailName)}`,
  );
  const versionDirectory = path.join(emailDirectory, "versions", "v001");
  const template = String(options.template ?? "promotional/v001");
  const starterPath = path.join(startersRoot, template, "email.jsx.template");
  if (!(await exists(starterPath))) throw new Error(`No existe el starter ${template}.`);

  const subject = String(options.subject ?? emailName);
  const preheader = String(options.preheader ?? subject);
  const starter = (await readFile(starterPath, "utf8"))
    .replaceAll("@BRAND_IMPORT@", university.brandImport)
    .replaceAll("@BRAND_EXPORT@", university.brandExport)
    .replaceAll("@SUBJECT_JSON@", JSON.stringify(subject))
    .replaceAll("@PREHEADER_JSON@", JSON.stringify(preheader));

  await mkdir(versionDirectory, { recursive: true });
  await writeFile(path.join(versionDirectory, "email.jsx"), starter, "utf8");
  await writeJson(path.join(emailDirectory, "email.json"), {
    schemaVersion: 1,
    emailId,
    campaignId,
    university: universityId,
    name: emailName,
    createdAt: isoDate(),
  });
  await writeJson(path.join(versionDirectory, "version.json"), {
    schemaVersion: 1,
    deliveryId: `${emailId}-v001`,
    emailId,
    version: "v001",
    basedOn: null,
    university: universityId,
    campaignId,
    kitRevision: "v001",
    layoutRevision: template,
    brandRevision: `${universityId}/${university.defaultBrandRevision}`,
    subject,
    preheader,
    status: "draft",
    createdAt: isoDate(),
    generatedAt: null,
    releasedAt: null,
    source: "email.jsx",
    output: "artifacts/email.html",
    outputSha256: null,
    inputSha256: null,
  });
  await writeCatalog();
  console.log(`Correo creado: ${emailId}@v001`);
  console.log(`Campaña: ${campaignId}`);
  console.log(`Ruta: ${relative(versionDirectory)}`);
}

async function commandNew(options) {
  if (options.from) {
    await commandNewFromExisting(String(options.from));
  } else {
    await commandNewFromTemplate(options);
  }
}

async function diffPair(label, leftPath, rightPath) {
  if (!(await exists(leftPath)) || !(await exists(rightPath))) {
    console.log(`${label}: uno de los archivos todavía no existe.`);
    return;
  }
  console.log(`${label}:`);
  const result = run("git", ["diff", "--no-index", "--no-ext-diff", "--", leftPath, rightPath]);
  if (![0, 1].includes(result.status)) {
    throw new Error(`No se pudo comparar ${label}.`);
  }
}

async function commandDiff(leftSpec, rightSpec) {
  if (!leftSpec || !rightSpec) {
    throw new Error("Indica dos versiones: npm run email:diff -- <id>@v001 <id>@v002");
  }
  const records = await loadRecords();
  const left = resolveRecord(records, leftSpec);
  const right = resolveRecord(records, rightSpec);
  await diffPair("Fuente editable", left.sourcePath, right.sourcePath);
  await diffPair("HTML final", left.artifactPath, right.artifactPath);
}

function printHelp() {
  console.log(`
Gestión de correos versionados

  npm run email:list
  npm run email:new -- --university ulatina --campaign-name "Campaña" --email-name "Lanzamiento"
  npm run email:new -- --from ulat-eml-2026-001-01@v001
  npm run dev -- ulat-eml-2026-001-01@v001
  npm run export -- ulat-eml-2026-001-01@v001
  npm run email:check -- --all
  npm run check:compile
  npm run email:diff -- <id>@v001 <id>@v002
  npm run email:release -- <id>@v001
`);
}

async function main() {
  const [command = "help", ...tokens] = process.argv.slice(2);
  const { options, positionals } = parseArgs(tokens);

  switch (command) {
    case "list":
      await commandList();
      break;
    case "catalog":
      await commandCatalog();
      break;
    case "compile":
      await commandCompile();
      break;
    case "check":
      await commandCheck(positionals[0], Boolean(options.all));
      break;
    case "dev":
      await commandDev(positionals[0], options.port);
      break;
    case "export":
      await commandExport(positionals[0], false);
      break;
    case "release":
      await commandExport(positionals[0], true);
      break;
    case "new":
      await commandNew(options);
      break;
    case "diff":
      await commandDiff(positionals[0], positionals[1]);
      break;
    case "help":
    case "--help":
    case "-h":
      printHelp();
      break;
    default:
      throw new Error(`Comando desconocido: ${command}.`);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
