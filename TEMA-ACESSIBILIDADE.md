# Sistema de Tema com Foco em Acessibilidade Visual

## 🌓 Funcionalidades Implementadas

### Alternância de Tema
- **Botão de alternância** no cabeçalho da aplicação
- **Ícones intuitivos**: Sol para modo claro, Lua para modo escuro
- **Transições suaves** entre os temas
- **Persistência** da preferência no localStorage

### Modo Escuro Otimizado para Acessibilidade
O modo escuro foi especialmente projetado para pessoas com dificuldades visuais:

#### Cores de Fundo
- **Fundo principal**: Cinza escuro suave (12% de luminosidade)
- **Cards e elementos**: Cinza um pouco mais claro (15% de luminosidade)
- **Elementos secundários**: Cinza médio (20% de luminosidade)

#### Cores de Texto
- **Texto principal**: Branco quase puro (95% de luminosidade) para máximo contraste
- **Texto secundário**: Cinza claro (75% de luminosidade) ainda com boa legibilidade
- **Bordas**: Mais visíveis (25% de luminosidade) para melhor definição

#### Cores de Destaque
- **Azul primário**: Mais claro e vibrante (70% de luminosidade)
- **Verde de sucesso**: Mais claro (55% de luminosidade)
- **Vermelho de erro**: Mais claro (65% de luminosidade)
- **Amarelo de aviso**: Mais vibrante (60% de luminosidade)

### Recursos de Acessibilidade

#### Alto Contraste
- Todas as combinações de cores atendem aos padrões WCAG AA
- Contraste mínimo de 4.5:1 para texto normal
- Contraste mínimo de 3:1 para texto grande

#### Elementos Visuais
- **Bordas mais visíveis** para definir melhor os elementos
- **Sombras adaptadas** para cada tema
- **Foco visual aprimorado** para navegação por teclado
- **Scrollbar personalizada** que se adapta ao tema

#### Transições
- **Animações suaves** de 300ms para mudança de tema
- **Sem flicker** durante a alternância
- **Preservação do estado** da aplicação

## 🚀 Como Usar

### Alternando o Tema
1. Localize o botão de tema no cabeçalho da aplicação (ícone de sol/lua)
2. Clique no botão para alternar entre modo claro e escuro
3. A preferência será salva automaticamente

### Para Desenvolvedores

#### Hook useTheme
```typescript
import { useTheme } from '@/hooks/useTheme';

function MeuComponente() {
  const { theme, toggleTheme, setTheme } = useTheme();
  
  return (
    <div>
      <p>Tema atual: {theme}</p>
      <button onClick={toggleTheme}>Alternar Tema</button>
      <button onClick={() => setTheme('dark')}>Modo Escuro</button>
      <button onClick={() => setTheme('light')}>Modo Claro</button>
    </div>
  );
}
```

#### Classes CSS Úteis
```css
/* Texto de alto contraste */
.high-contrast-text

/* Texto com gradiente adaptável */
.gradient-text

/* Glass morphism adaptável */
.glass

/* Sombras adaptáveis */
.shadow-soft
.shadow-glow
```

#### Variáveis CSS Disponíveis
```css
/* Cores principais */
--background
--foreground
--card
--card-foreground
--primary
--primary-foreground

/* Cores de estado */
--success
--danger
--warning
--info

/* Cores específicas com foreground */
--success-foreground
--danger-foreground
--warning-foreground
--info-foreground
```

## 🎨 Personalização

### Modificando Cores
As cores podem ser ajustadas no arquivo `src/index.css`:

```css
.dark {
  --background: 0 0% 12%; /* Ajuste a luminosidade aqui */
  --foreground: 0 0% 95%; /* Ajuste o contraste aqui */
  /* ... outras variáveis */
}
```

### Adicionando Novas Variantes
Para adicionar novas cores, adicione tanto no modo claro quanto escuro:

```css
:root {
  --minha-cor: 200 100% 50%;
  --minha-cor-foreground: 0 0% 100%;
}

.dark {
  --minha-cor: 200 100% 60%; /* Mais claro no modo escuro */
  --minha-cor-foreground: 0 0% 5%;
}
```

## 🔧 Configuração Técnica

### Detecção Automática
O sistema detecta automaticamente a preferência do usuário:
1. Verifica se há uma preferência salva no localStorage
2. Se não houver, usa a preferência do sistema operacional
3. Padrão para modo claro se nenhuma preferência for detectada

### Persistência
- A preferência é salva no `localStorage` com a chave `autogestor-theme`
- Mantém a escolha entre sessões do navegador
- Sincroniza automaticamente com mudanças

### Performance
- **CSS Variables**: Mudanças instantâneas sem re-renderização
- **Transições otimizadas**: Apenas propriedades necessárias
- **Lazy loading**: Hook só carrega quando necessário

## 🌟 Benefícios para Acessibilidade

### Para Pessoas com Dificuldades Visuais
- **Contraste máximo** no modo escuro
- **Cores mais vibrantes** para melhor percepção
- **Bordas definidas** para separação clara de elementos
- **Texto mais legível** mesmo à distância

### Para Todos os Usuários
- **Redução da fadiga ocular** em ambientes escuros
- **Melhor experiência noturna**
- **Economia de bateria** em telas OLED
- **Preferência pessoal** respeitada

## 📱 Compatibilidade

- ✅ Chrome/Edge 88+
- ✅ Firefox 85+
- ✅ Safari 14+
- ✅ Mobile browsers
- ✅ Modo de alto contraste do sistema
- ✅ Leitores de tela

## 🐛 Solução de Problemas

### Tema não persiste
Verifique se o localStorage está habilitado no navegador.

### Cores não mudam
Certifique-se de que os componentes estão usando as variáveis CSS corretas (`hsl(var(--variable))`).

### Transições lentas
Ajuste a duração da transição em `--transition-smooth` no CSS.

---

**Desenvolvido com foco em acessibilidade e experiência do usuário** 🎯