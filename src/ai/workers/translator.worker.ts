import { pipeline, env } from "@huggingface/transformers";

// Deshabilitar búsqueda de modelos locales en el file system (exclusivo para web)
env.allowLocalModels = false;

class MyTranslationPipeline {
  static task = "translation" as const;
  // Usaremos un modelo multilingüe. Xenova/nllb-200-distilled-600M es muy capaz (soporta 200 idiomas).
  static model = "Xenova/nllb-200-distilled-600M";
  static instance: any = null;

  static async getInstance(progress_callback: (info: any) => void) {
    if (this.instance === null) {
      // @ts-ignore
      this.instance = await pipeline(this.task, this.model, {
        progress_callback,
      });
    }
    return this.instance;
  }
}

// Escuchar mensajes desde el hilo principal
self.addEventListener("message", async (event) => {
  const { text, src_lang, tgt_lang } = event.data;

  try {
    const translator = await MyTranslationPipeline.getInstance((info) => {
      // Enviar progreso de descarga al hilo principal
      self.postMessage({ status: "progress", ...info });
    });

    // Ejecutar traducción
    const output = await translator(text, {
      src_lang,
      tgt_lang,
    });

    self.postMessage({
      status: "complete",
      output: output,
    });
  } catch (error: any) {
    self.postMessage({ status: "error", error: error.message });
  }
});
