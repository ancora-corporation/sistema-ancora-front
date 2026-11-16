import { useState } from 'react';
import { apiRequest } from '../services/api';
import { Auth } from '../services/auth';

const camposIniciais = { nome: '', email: '', telefone: '', senhaAtual: '', novaSenha: '', confirmarNovaSenha: '' };

export default function MinhaConta() {
  const [aberta, setAberta] = useState(false);
  const [campos, setCampos] = useState(camposIniciais);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [salvando, setSalvando] = useState(false);

  function abrir() {
    const usuario = Auth.usuarioAtual();
    setCampos({ ...camposIniciais, nome: usuario?.nome || '', email: usuario?.email || '', telefone: usuario?.telefone || '' });
    setErro('');
    setSucesso('');
    setAberta(true);
  }

  function alterar(evento) {
    setCampos((atuais) => ({ ...atuais, [evento.target.name]: evento.target.value }));
  }

  async function salvar(evento) {
    evento.preventDefault();
    setErro('');
    setSucesso('');
    if (campos.novaSenha && campos.novaSenha.length < 10) {
      setErro('A nova senha deve ter pelo menos 10 caracteres.');
      return;
    }
    if (campos.novaSenha !== campos.confirmarNovaSenha) {
      setErro('A confirmação da nova senha não confere.');
      return;
    }
    setSalvando(true);
    try {
      const { usuario } = await apiRequest('/auth/me', {
        method: 'PATCH',
        body: JSON.stringify(campos),
      });
      Auth.atualizarUsuario(usuario);
      setCampos((atuais) => ({ ...atuais, senhaAtual: '', novaSenha: '', confirmarNovaSenha: '' }));
      setSucesso('Dados cadastrais atualizados.');
    } catch (error) {
      setErro(error.message);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <>
      <button type="button" className="btn btn-outline-primary btn-sm" onClick={abrir}>Minha conta</button>
      {aberta && (
        <div className="modal d-block" role="dialog" aria-modal="true" aria-labelledby="titulo-minha-conta" tabIndex="-1" style={{ background: 'rgba(0, 0, 0, .5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content">
              <form onSubmit={salvar}>
                <div className="modal-header">
                  <h2 className="modal-title fs-5" id="titulo-minha-conta">Minha conta</h2>
                  <button type="button" className="btn-close" aria-label="Fechar" onClick={() => setAberta(false)} />
                </div>
                <div className="modal-body">
                  <p className="text-secondary small">Altere seus dados pessoais. Para confirmar, informe sua senha atual. O perfil de acesso e a escola são gerenciados pelo administrador.</p>
                  {erro && <div className="alert alert-danger" role="alert">{erro}</div>}
                  {sucesso && <div className="alert alert-success" role="status">{sucesso}</div>}
                  <div className="mb-3"><label htmlFor="conta-nome" className="form-label">Nome completo</label><input id="conta-nome" name="nome" className="form-control" autoComplete="name" required minLength={2} maxLength={120} value={campos.nome} onChange={alterar} /></div>
                  <div className="mb-3"><label htmlFor="conta-email" className="form-label">E-mail</label><input id="conta-email" name="email" type="email" className="form-control" autoComplete="email" required value={campos.email} onChange={alterar} /></div>
                  <div className="mb-3"><label htmlFor="conta-telefone" className="form-label">Telefone</label><input id="conta-telefone" name="telefone" type="tel" className="form-control" autoComplete="tel" maxLength={30} value={campos.telefone} onChange={alterar} /></div>
                  <hr />
                  <h3 className="h6">Alterar senha</h3>
                  <p className="text-secondary small">Deixe os campos de nova senha vazios se quiser alterar somente seus dados cadastrais.</p>
                  <div className="mb-3"><label htmlFor="conta-senha-atual" className="form-label">Senha atual</label><input id="conta-senha-atual" name="senhaAtual" type="password" className="form-control" autoComplete="current-password" required value={campos.senhaAtual} onChange={alterar} /></div>
                  <div className="mb-3"><label htmlFor="conta-nova-senha" className="form-label">Nova senha</label><input id="conta-nova-senha" name="novaSenha" type="password" className="form-control" autoComplete="new-password" minLength={10} value={campos.novaSenha} onChange={alterar} /><div className="form-text">Use pelo menos 10 caracteres.</div></div>
                  <div><label htmlFor="conta-confirmar-senha" className="form-label">Confirme a nova senha</label><input id="conta-confirmar-senha" name="confirmarNovaSenha" type="password" className="form-control" autoComplete="new-password" value={campos.confirmarNovaSenha} onChange={alterar} /></div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-outline-secondary" onClick={() => setAberta(false)}>Fechar</button>
                  <button type="submit" className="btn btn-primary" disabled={salvando}>{salvando ? 'Salvando…' : 'Salvar alterações'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
