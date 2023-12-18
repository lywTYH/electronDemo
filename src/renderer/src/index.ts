// import './styles/index.css';

document.getElementById('toggle-dark-mode')!.addEventListener('click', async () => {
  // const isDarkMode = await toggle();
  const isDarkMode = false;
  document.getElementById('theme-source')!.innerHTML = isDarkMode ? 'Dark' : 'Light';
});

document.getElementById('reset-to-system')!.addEventListener('click', async () => {
  // await system();
  document.getElementById('theme-source')!.innerHTML = 'System';
});
