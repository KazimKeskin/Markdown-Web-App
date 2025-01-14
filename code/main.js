const fileList = document.getElementById('fileList');
const markdownContent = document.getElementById('markdownContent');
const titleHeading = document.getElementById('heading');
const dateHeading = document.getElementById('date');
const timeHeading = document.getElementById('time');
const backlinkSection = document.getElementById('backlinks');
const linkSection = document.getElementById('links');
const page = document.getElementById('page');
const headingsSection = document.getElementById('headingsSection');


let jsonData;
let notebookLoaded = false;

window.onload = async () => {
  await load(); // Ensure data is loaded
  window.onhashchange = loadPage; // Attach after data is ready
};


function createNestedList(jsonData, fileList) {
  const ul = document.createElement('ul');
  for (const key in jsonData) {
    const li = document.createElement('li');
    const title = jsonData[key].title;
    li.textContent = title;
    li.id = jsonData[key].filepath;
    li.dataset.dateModified = jsonData[key].dateModified
    if (jsonData[key].type === 'folder') {
      li.classList.add('folder');
    }
    else if (jsonData[key].type === 'file') {
      li.classList.add('file');
    }
    li.addEventListener('click', () => {
      window.location.hash = li.id;
      const allLiElements = document.getElementById('sidebar').querySelectorAll('li');
      allLiElements.forEach(li => {
        li.classList.remove('active');
      });
      li.classList.add('active');
    });
    ul.appendChild(li);
  }
  fileList.appendChild(ul);
}


async function load() {
  await getData()
  .then(data => {
    jsonData = data;
    notebookLoaded = true;
    createNestedList(jsonData, fileList);
    loadPage();
  })
  .catch(error => {
    console.error('Error:', error.message);
  });
}


async function getData() {
  try {
    const response = await fetch('code/build_JSON.php');

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error:', error.message);
    return { error: 'Error fetching data' };
  }
}


function loadPage() {
  console.log(jsonData);
    const hash = window.location.hash.slice(1);
    if (hash && notebookLoaded) {
      item = findFileInJSON(hash, jsonData)
      console.log(item)
      if (item === null) {
        return
      }
      else {
        renderPage(item);
      }
    }
}


function findFileInJSON(hash, jsonData) {
  for (const key in jsonData) {
    if (jsonData[key].filepath == hash.replace(/%20/g, ' ')) {
      return jsonData[key];
    }
  }
  return null;
}


function renderPage(item) {
  clearPage();
  addMeta(item);
  addContent(item)
    .then(() => {
      updateLinks(backlinkSection);
      updateLinks(linkSection);
      updateLinks(page);
      listMarkdownHeadings(item.content);
    })
    .catch(error => {
      console.error("Error adding content:", error);
    });
}


function clearPage() {
  markdownContent.innerHTML = "";
  titleHeading.innerText = "";
  dateHeading.innerText = "";
  timeHeading.innerText = "";
  backlinkSection.innerHTML = "";
  linkSection.innerHTML = "";
  headingsSection.innerHTML = "";
}


function addContent(item) {
  return new Promise((resolve) => {
    let content = item.content;
    content = parseLinks(content);
    markdownContent.mdContent = content;
    displayBacklinks(item);
    displayLinks(item);

    markdownContent.addEventListener('md-render', function() {
      clearTimeout(timeoutId);
      resolve();
    }, { once: true });

    timeoutId = setTimeout(() => {
      console.warn("md-render timeout! Resolving anyway.");
      reject(new Error("md-render timeout"));
    }, 500);
  });
}


function addMeta(item) {
  titleHeading.innerText = item.title;
  dateHeading.innerText = new Date(item.dateModified * 1000).toLocaleString("en-GB", {  year: 'numeric', month: 'long', day: 'numeric' });
  timeHeading.innerText = new Date(item.dateModified * 1000).toLocaleString("en-GB", {  hour: 'numeric', minute: 'numeric'});
}
