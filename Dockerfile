# Imagem base leve, oficial, mantida pelo próprio time do Nginx.
# "alpine" reduz o tamanho final da imagem (~40 MB) em troca de menos
# utilitários de sistema — suficiente para servir arquivos estáticos.
FROM nginx:alpine

# Remove o site de exemplo que vem por padrão na imagem, para não
# misturar com o nosso conteúdo.
RUN rm -rf /usr/share/nginx/html/*

# Copia só o que o navegador precisa: a página e o módulo de validação
# que ela carrega via <script src="pessoaFisica.js">.
COPY index.html /usr/share/nginx/html/index.html
COPY pessoaFisica.js /usr/share/nginx/html/pessoaFisica.js

# Porta padrão em que o nginx escuta dentro do container.
EXPOSE 80

# "daemon off" mantém o nginx em primeiro plano — é isso que faz o
# container continuar rodando (sem isso, o processo encerraria e o
# container morreria junto).
CMD ["nginx", "-g", "daemon off;"]
