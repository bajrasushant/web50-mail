document.addEventListener('DOMContentLoaded', function() {

	// Use buttons to toggle between views
	document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
	document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
	document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
	document.querySelector('#compose').addEventListener('click', compose_email);
	document.querySelector('#compose-form').addEventListener('submit', send_mail);
	// By default, load the inbox
	load_mailbox('inbox');
	document.querySelectorAll('button').forEach(button => {
        button.onclick = function() {
            let section = button.id;
			if (section === 'archived') {
				section = 'archive';
			}
			if (section === 'inbox' || section === 'sent' || section === 'archive') {
				history.pushState({ mailbox: section }, "", `mailbox${section}`);
			} else if (section === 'compose' || section ==='compose-form') {
				history.pushState({ compose: 'compose'}, '', `mailboxcompose`);
			}
		}
	});

	
	
});

window.onpopstate = function(event) {
	// console.log(event.state);
	// const routes = ['/', '', '/login', '/register', '/logout']
	if (event.state) {
		if (event.state.mailbox) {
			load_mailbox(event.state.mailbox);
		} else if (event.state.email_id) {
			load_email(event.state.email_id);
		} else if (event.state.compose === "compose") {
			compose_email();
		} else {
			load_mailbox('inbox');
		}
	}
};

function compose_email() {

	// Show compose view and hide other views
	document.querySelector('#emails-view').style.display = 'none';
	document.querySelector('#compose-view').style.display = 'block';
	document.querySelector('#email-details').style.display = 'none';
	// Clear out composition fields
	document.querySelector('#compose-recipients').value = '';
	document.querySelector('#compose-subject').value = '';
	document.querySelector('#compose-body').value = '';
	// sending the email
	document.querySelector('form').onsubmit = () => send_mail;

}

function load_mailbox(mailbox) {
	// Show the mailbox and hide other views
	document.querySelector('#emails-view').style.display = 'block';
	document.querySelector('#compose-view').style.display = 'none';
	document.querySelector('#email-details').style.display = 'none';
	// Show the mailbox name
	document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;
	fetch(`/emails/${mailbox}`)
	.then(response => response.json())
	.then(emails => {
		// Print emails
		emails.forEach(function(email) {
			// console.log(email);
			// displays who the email is from, what the subject line is, and the timestamp of the email.
			const from = email.sender;
			const to = email.recipients;
			const subject = email.subject;
			const time = email.timestamp;
			const read = email.read;
			const id = email.id;
			const archived = email.archived;
			// ... do something else with emails ...
			const box = document.createElement('div');
			box.classList.add('card', 'mb-2', 'mail');
			const boxDetails = document.createElement('div');
			boxDetails.classList.add('card-body');
			const archButton = document.createElement('button');
			// archButton.setAttribute('id', 'archive-button');
			const view = document.createElement('div');
			view.classList.add('detail-view');
			view.setAttribute("id", id);
			if (mailbox == 'sent') {
				view.innerHTML = `<p><strong>To: ${to}</strong></p>
										<p><strong>Subject: </strong>${subject}</p>
										<p><strong>Received: </strong>${time}</p>`; 
				boxDetails.append(view);
			}
			else{
				view.innerHTML = `<p><strong>From: ${from}</strong></p>
										<p><strong>Subject: </strong>${subject}</p>
										<p><strong>Received: </strong>${time}</p>`;
				boxDetails.append(view);
				if (read == true) {
					box.classList.add('bg-secondary', 'text-light');
				} else {
					box.classList.add('bg-light');
				}       
				if (mailbox == 'inbox') {
					archButton.classList.add('btn', 'btn-warning');
					archButton.innerHTML = 'Archive';
				} else {
					archButton.classList.add('btn', 'btn-info');
					archButton.innerHTML = 'Unarchive';
				}
				boxDetails.append(archButton);
			}
			
			box.append(boxDetails);
			document.querySelector('#emails-view').append(box);
			archButton.addEventListener('click', () => archive(view.id, archived));
			// view.addEventListener('click',() => history.pushState({ email_id: view.id }, '', `email${view.id}`));
			// view.addEventListener('click', () => load_email(view.id, mailbox));
			view.addEventListener('click', () => {
				history.pushState({ email_id: view.id }, '', `email${view.id}`);
				load_email(view.id, mailbox);
			  });
		})
		});
}

function send_mail(event) {
	event.preventDefault();
	const receiver = document.querySelector('#compose-recipients').value;
	const subject = document.querySelector('#compose-subject').value;
	const body = document.querySelector('#compose-body').value;

	fetch('/emails', {
		method: 'POST',
		body: JSON.stringify({
		recipients: receiver,
		subject: subject,
		body: body
		})
	})
	.then(response => response.json())
	.then(result => {
		console.log(result);
		load_mailbox('sent');
	});
	}

// mailbox as parameter as to detect if customer access through inbox or sentbox to mark read and unread accordingly
function load_email(id, mailbox) {
	console.log(mailbox);
	document.querySelector('#emails-view').style.display = 'none';
	document.querySelector('#compose-view').style.display = 'none';
	document.querySelector('#email-details').style.display = 'block';
	
	fetch(`emails/${id}`)
	.then(response => response.json())
	.then(email => {
		if(mailbox != 'sent') {
			fetch(`emails/${id}`, {
				method: 'PUT',
				body: JSON.stringify({
					read: true
						})
					})
			}
			
		// Print email
		// console.log(email);
		// console.log(id);

		// ... do something else with email ...
		// Your application should show the email’s sender, recipients, subject, timestamp, and body.
		document.querySelector('#email-subject').innerHTML = `Subject: ${email.subject}`;
		document.querySelector('#email-sender').innerHTML = `From: ${email.sender}`;
		document.querySelector('#email-receiver').innerHTML = `To: ${email.recipients}`;
		document.querySelector('#email-time').innerHTML = `At: ${email.timestamp}`;
		document.querySelector('#email-body').innerHTML = `${email.body}`;

		
		const reply = document.getElementById('reply-button');
		reply.addEventListener('click', () => reply_email(id));
	});
	}

function archive(id, status) {
	const view = document.getElementById(id);
	const wholeCard = view.parentElement.parentElement;
	wholeCard.style.animationPlayState = 'running';
	wholeCard.addEventListener('animationend', () => {
		wholeCard.remove();
	});

	if(status === false){
		fetch(`emails/${id}`, {
			method: 'PUT',
			body: JSON.stringify({
				archived: true
			})
		})
	} else {
		fetch(`emails/${id}`, {
			method: 'PUT',
			body: JSON.stringify({
				archived: false
			})
		})
	}

}

function reply_email(id) {
	fetch(`/emails/${id}`)
	.then(response => response.json())
	.then(email => {
    // showing form
	document.querySelector('#emails-view').style.display = 'none';
	document.querySelector('#compose-view').style.display = 'block';
	document.querySelector('#email-details').style.display = 'none';
	const form = document.querySelector('#compose-form');
	form['compose-recipients'].value = email.sender;
	if(email.subject.startsWith('Re:'))
	{	
		form['compose-subject'].value = email.subject;
	}
	else {
		form['compose-subject'].value = `Re: ${email.subject}`
	}	
	form['compose-body'].value = `On ${email.timestamp} ${email.sender} wrote:\n${email.body}\nReplying:\n`
    
	form.onsubmit = () => send_mail;
});
}
	