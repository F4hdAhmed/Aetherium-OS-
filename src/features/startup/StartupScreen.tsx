import { Icon } from '../../components/icons/Icon';

interface StartupScreenProps {
  leaving: boolean;
}

export function StartupScreen({ leaving }: StartupScreenProps) {
  return (
    <div className={'startup-screen' + (leaving ? ' is-leaving' : '')} aria-label="Starting Aetherium OS">
      <div className="startup-screen__aurora startup-screen__aurora--violet" />
      <div className="startup-screen__aurora startup-screen__aurora--cyan" />
      <div className="startup-screen__grid" />
      <div className="startup-screen__core">
        <div className="startup-orbit startup-orbit--outer"><i /><i /><i /></div>
        <div className="startup-orbit startup-orbit--inner"><i /><i /></div>
        <div className="startup-screen__mark"><Icon name="aetherium" size={42} /></div>
      </div>
      <div className="startup-screen__identity">
        <p>Developer intelligence system</p>
        <h1>Aetherium <span>OS</span></h1>
      </div>
      <div className="startup-screen__progress"><i /></div>
      <div className="startup-screen__telemetry">
        <span><i /> Workspace engine</span>
        <span><i /> Editor services</span>
        <span><i /> Aether bridge</span>
      </div>
      <small>INITIALIZING ENVIRONMENT</small>
      <div className="startup-screen__creator" aria-label="Created by Fahd Ahmed">
        <span>Created by</span>
        <strong>Fahd Ahmed</strong>
      </div>
    </div>
  );
}
