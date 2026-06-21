import { useState } from 'react'
import { useIdioma } from '../i18n.js'
import './ModalPortada.css'

export default function ModalPortada({ proyecto, onGuardar, onCerrar }) {
  const { t } = useIdioma()
  const portada = proyecto.portada || {}
  const [form, setForm] = useState({
    autor:     portada.autor     || '',
    contacto:  portada.contacto  || '',
    email:     portada.email     || '',
    telefono:  portada.telefono  || '',
    version:   portada.version   || t('version_def'),
    fecha:     portada.fecha     || '',
    registro:  portada.registro  || '',
  })

  function campo(key, valor) {
    setForm(f => ({ ...f, [key]: valor }))
  }

  return (
    <div className="modal-overlay" onClick={onCerrar}>
      <div className="modal-portada" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-titulo">{t('portada_titulo')}</span>
          <button className="modal-cerrar" onClick={onCerrar}>✕</button>
        </div>

        <div className="modal-preview">
          <div className="preview-titulo">{proyecto.nombre.toUpperCase()}</div>
          <div className="preview-sub">{t('p_escrito_por')}</div>
          <div className="preview-autor">{form.autor || t('p_autor_def')}</div>
          <div className="preview-pie-izq">
            {[form.autor, form.contacto, form.email, form.telefono].filter(Boolean).join('\n')}
          </div>
          <div className="preview-pie-der">
            {[form.fecha, form.version, form.registro].filter(Boolean).join('\n') || t('version_def')}
          </div>
        </div>

        <div className="modal-campos">
          <div className="campo-grupo">
            <label>{t('p_autor_label')}</label>
            <input
              value={form.autor}
              onChange={e => campo('autor', e.target.value)}
              placeholder={t('p_autor_ph')}
            />
          </div>
          <div className="campo-grupo">
            <label>{t('p_contacto_label')}</label>
            <input
              value={form.contacto}
              onChange={e => campo('contacto', e.target.value)}
              placeholder={t('p_contacto_ph')}
            />
          </div>
          <div className="campo-fila">
            <div className="campo-grupo">
              <label>{t('p_email_label')}</label>
              <input
                value={form.email}
                onChange={e => campo('email', e.target.value)}
                placeholder={t('p_email_ph')}
              />
            </div>
            <div className="campo-grupo">
              <label>{t('p_tel_label')}</label>
              <input
                value={form.telefono}
                onChange={e => campo('telefono', e.target.value)}
                placeholder={t('p_tel_ph')}
              />
            </div>
          </div>
          <div className="campo-fila">
            <div className="campo-grupo">
              <label>{t('p_version_label')}</label>
              <input
                value={form.version}
                onChange={e => campo('version', e.target.value)}
                placeholder={t('version_def')}
              />
            </div>
            <div className="campo-grupo">
              <label>{t('p_fecha_label')}</label>
              <input
                value={form.fecha}
                onChange={e => campo('fecha', e.target.value)}
                placeholder={t('p_fecha_ph')}
              />
            </div>
          </div>
          <div className="campo-grupo">
            <label>{t('p_registro_label')}</label>
            <input
              value={form.registro}
              onChange={e => campo('registro', e.target.value)}
              placeholder={t('p_registro_ph')}
            />
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-cancelar" onClick={onCerrar}>{t('cancelar')}</button>
          <button className="btn-guardar" onClick={() => onGuardar(form)}>{t('guardar_portada')}</button>
        </div>
      </div>
    </div>
  )
}
