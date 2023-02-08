document.addEventListener('DOMContentLoaded', function () {

	// Use buttons to toggle between views
	document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
	document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
	document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
	document.querySelector('#compose').addEventListener('click', compose_email);

	// By default, load the inbox
	load_mailbox('inbox');
});


function compose_email() {

	// Show compose view and hide other views
	document.querySelector('#emails-view').style.display = 'none';
	document.querySelector('#compose-view').style.display = 'block';
	document.querySelector('#single-email-view').style.display = 'none';

	// Clear out composition fields
	document.querySelector('#compose-recipients').value = '';
	document.querySelector('#compose-subject').value = '';
	document.querySelector('#compose-body').value = '';

	// Submit the data on the compose form
	document.querySelector('#compose-form').onsubmit = function () {
		const recipients = document.querySelector('#compose-recipients').value;
		const subject = document.querySelector('#compose-subject').value;
		const body = document.querySelector('#compose-body').value

		fetch('/emails', {
			method: 'POST',
			body: JSON.stringify({
				recipients: recipients,
				subject: subject,
				body: body
			})
		})
			.then((response) => response.json())
			.then((result) => {
				console.log(result);
				load_mailbox('sent');
			})

		// Prevent form from refreshing the page when submitted
		return false
	}
}


function load_mailbox(mailbox) {

	// Show the mailbox and hide other views
	const emailsView = document.querySelector('#emails-view');
	const composeView = document.querySelector('#compose-view');
	const singleEmailView = document.querySelector('#single-email-view');

	emailsView.style.display = 'block';
	composeView.style.display = 'none';
	singleEmailView.style.display = 'none';

	// Clear out the single email view so the user only sees one email
	singleEmailView.innerHTML = ''

	// Show the mailbox name
	emailsView.innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

	// Query the API for the latest emails
	fetch(`/emails/${mailbox}`)
		.then((response) => response.json())
		.then((emails) => {

			// Save the repsonse in an array
			const emailsArray = emails;

			// create a div for each email and assign a class name
			emailsArray.forEach(email => {

				const emailContainer = document.createElement('div');
				emailContainer.className = "single-email";

				// Create 3 span elements for sender - subject - timestamp and append to emailContainer
				const sender = document.createElement('span');
				sender.innerHTML = email.sender;
				emailContainer.appendChild(sender);

				const subject = document.createElement('span');
				subject.innerHTML = email.subject;
				emailContainer.appendChild(subject);

				const timeStamp = document.createElement('span');
				timeStamp.innerHTML = email.timestamp;
				emailContainer.appendChild(timeStamp);

				//Add an event handler when user clicks the email
				emailContainer.addEventListener('click', function () {
					const email_id = email.id

					// mark email as read when clicked
					fetch(`/emails/${email_id}`, {
						method: 'PUT',
						body: JSON.stringify({
							read: true
						})
					});

					// Hide inbox and compse views and show email dettail view
					singleEmailView.style.display = 'block';
					emailsView.style.display = 'none';
					composeView.style.display = 'none';

					// call show_email function
					show_email(`${mailbox}`, email_id);
				});

				// set background color for read and unread emails
				if (email.read === true)
					emailContainer.style.backgroundColor = 'gray';
				else
					emailContainer.style.backgroundColor = 'white';

				// Append the created div to emails-view div
				emailsView.appendChild(emailContainer);
			});
		})
} // End function load_mailbox


function show_email(mailbox, email_id) {

	const singleEmailView = document.querySelector('#single-email-view');

	// make a get request to /emails/<email_id> to request the email
	fetch(`/emails/${email_id}`)
		.then((response) => response.json())
		.then((email) => {

			//create HTML elements to display the sender, recipients, subject, timestamp, and body
			const sender = document.createElement('p');
			sender.innerHTML = `<span class="bold-class">From:</span> ${email.sender}`;

			const recipients = document.createElement('p');
			recipients.innerHTML = `<span class="bold-class">To:</span>  ${email.recipients.join(',')}`;

			const subject = document.createElement('p');
			subject.innerHTML = `<span class="bold-class">Subject:</span> ${email.subject}`;

			const timeStamp = document.createElement('p');
			timeStamp.innerHTML = `<span class="bold-class">Date:</span> ${email.timestamp}`;

			const emailBody = document.createElement('div');
			emailBody.className = "show-email-body";
			emailBody.innerHTML = `<pre>${email.body}</pre>`;

			// Create the Reply, Archive and, Unarchive buttons
			const replyButton = document.createElement('button');
			replyButton.innerText = "Reply";
			replyButton.className = "btn btn-sm btn-outline-primary";
			replyButton.id = "reply-btn";

			// Show reply button only when email opened from inbox
			if (mailbox === 'inbox') {
				replyButton.style.dispaly = 'inline-block';
			} else {
				replyButton.style.display = 'none';
			}


			const archiveButton = document.createElement('button');
			archiveButton.innerText = "Archive";
			archiveButton.className = "btn btn-sm btn-outline-primary";
			archiveButton.id = "archive-btn";

			const unarchiveButton = document.createElement('button');
			unarchiveButton.innerText = "Unarchive";
			unarchiveButton.className = "btn btn-sm btn-outline-primary";
			unarchiveButton.id = "unarchive-btn";


			// add event handler when user clicks reply
			replyButton.addEventListener('click', function () {

				const replyTo = `${email.sender}`;
				let replyMsg = `${email.body}`;

				// Create a separator for reply emails
				let hLine = "--------------------------------------"

				// Get the subject and format it for the reply
				let replySubject = `${email.subject}`;

				if (replySubject.slice(0, 4) !== 'Re: ')
					replySubject = `Re: ${replySubject}`;

				// hide the single-email-view 
				singleEmailView.style.display = 'none';

				//load compose email view
				compose_email();

				// pre-fill recipient and subject line
				document.querySelector('#compose-recipients').value = `${replyTo}`;
				document.querySelector('#compose-subject').value = `${replySubject}`;
				document.querySelector('#compose-body').value = `\n\n${hLine}\nOn ${email.timestamp}, ${email.sender} wrote: \n\n${replyMsg}`
			});


			// Hide and/or show archive/unarchive
			if (mailbox !== 'sent') {
				if (email.archived === true) {
					archiveButton.style.display = "none";
					unarchiveButton.style.display = "inline-block";
				} else {
					archiveButton.style.display = "inline-block";
					unarchiveButton.style.display = "none";
				}
			} else {
				archiveButton.style.display = "none";
				unarchiveButton.style.display = "none";
				replyButton.style.display = "none";
			}


			// Add event handler when clicking archive / unarchive buttons
			archiveButton.addEventListener('click', () => {
				fetch(`/emails/${email_id}`, {
					method: 'PUT',
					body: JSON.stringify({
						archived: true
					})
				})
					.then((response) => {
						console.log(response);
						load_mailbox('inbox');
					})
			});

			unarchiveButton.addEventListener('click', () => {
				fetch(`/emails/${email_id}`, {
					method: 'PUT',
					body: JSON.stringify({
						archived: false
					})
				})
					.then((response) => {
						console.log(response);
						load_mailbox('inbox');
					})
			});

			// Add the created elements to single-email-view div
			singleEmailView.appendChild(sender);
			singleEmailView.appendChild(recipients);
			singleEmailView.appendChild(subject);
			singleEmailView.appendChild(timeStamp);
			singleEmailView.appendChild(replyButton);
			singleEmailView.appendChild(archiveButton);
			singleEmailView.appendChild(unarchiveButton);
			singleEmailView.appendChild(emailBody);
		});
	return false
} // End function show_email